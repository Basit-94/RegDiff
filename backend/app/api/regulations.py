import uuid
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db
from backend.app.models.models import Regulation, RegulationVersion, RegulationClause, RuleAssertion, PolicyDependency
from backend.app.schemas import (
    RegulationAmendRequest,
    RegulationResponse,
    RegulationVersionResponse,
    ClauseResponse,
)
from backend.app.engine.parser import calculate_sha256
from backend.app.services.audit_service import record_audit_event
from backend.app.core.telemetry import broadcaster

router = APIRouter(prefix="/regulations", tags=["Regulations"])

@router.get("", response_model=List[RegulationResponse])
async def list_regulations(db: AsyncSession = Depends(get_db)):
    stmt = select(Regulation).options(
        selectinload(Regulation.versions).selectinload(RegulationVersion.clauses)
    )
    result = await db.execute(stmt)
    regulations = result.scalars().all()
    return regulations

@router.get("/{code}", response_model=RegulationResponse)
async def get_regulation(code: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Regulation)
        .options(selectinload(Regulation.versions).selectinload(RegulationVersion.clauses))
        .where(Regulation.code == code)
    )
    result = await db.execute(stmt)
    reg = result.scalar_one_or_none()
    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"type": "NOT_FOUND", "title": "Regulation Not Found", "detail": f"No regulation found with code {code}"}
        )
    return reg

@router.post("/{code}/amend", response_model=RegulationVersionResponse, status_code=status.HTTP_201_CREATED)
async def ingest_amendment(
    code: str,
    payload: RegulationAmendRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Regulation).where(Regulation.code == code)
    result = await db.execute(stmt)
    reg = result.scalar_one_or_none()
    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"type": "NOT_FOUND", "title": "Regulation Not Found", "detail": f"Regulation '{code}' does not exist"}
        )

    # Deactivate previous versions and remove existing version with duplicate tag
    v_stmt = select(RegulationVersion).where(RegulationVersion.regulation_id == reg.id)
    v_res = await db.execute(v_stmt)
    for existing_v in v_res.scalars().all():
        if existing_v.version_tag == payload.version_tag:
            await db.delete(existing_v)
        else:
            existing_v.is_active = False
    await db.flush()

    # Create new version
    version_id = uuid.uuid4()
    new_version = RegulationVersion(
        id=version_id,
        regulation_id=reg.id,
        version_tag=payload.version_tag,
        published_date=payload.published_date,
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_version)
    await db.flush()

    clauses_created = []
    for c in payload.clauses:
        clause_hash = calculate_sha256(c.clause_text)
        new_clause = RegulationClause(
            id=uuid.uuid4(),
            version_id=new_version.id,
            clause_identifier=c.clause_identifier,
            clause_title=c.clause_title or c.clause_identifier,
            clause_text=c.clause_text,
            content_hash=clause_hash,
            created_at=datetime.now(timezone.utc)
        )
        db.add(new_clause)
        await db.flush()

        # Compile deterministic rule assertion if statutory clause matches known patterns
        if "30 days" in c.clause_text or "thirty (30) calendar days" in c.clause_text or "30 calendar days" in c.clause_text:
            assertion = RuleAssertion(
                id=uuid.uuid4(),
                regulation_clause_id=new_clause.id,
                parameter_key="max_data_retention_days",
                operator="<=",
                expected_value="30",
                error_message=f"Retention period exceeds maximum statutory cap of 30 days under {c.clause_identifier}."
            )
            db.add(assertion)
        elif "90 days" in c.clause_text:
            assertion = RuleAssertion(
                id=uuid.uuid4(),
                regulation_clause_id=new_clause.id,
                parameter_key="max_data_retention_days",
                operator="<=",
                expected_value="90",
                error_message=f"Retention period exceeds maximum statutory cap of 90 days under {c.clause_identifier}."
            )
            db.add(assertion)

        # Carry over existing policy dependencies matching this clause_identifier
        prev_deps_stmt = (
            select(PolicyDependency)
            .join(RegulationClause, PolicyDependency.regulation_clause_id == RegulationClause.id)
            .where(RegulationClause.clause_identifier == c.clause_identifier)
        )
        prev_deps_res = await db.execute(prev_deps_stmt)
        seen_pol_clauses = set()
        for prev_dep in prev_deps_res.scalars().all():
            if prev_dep.policy_clause_id not in seen_pol_clauses:
                seen_pol_clauses.add(prev_dep.policy_clause_id)
                new_dep = PolicyDependency(
                    id=uuid.uuid4(),
                    policy_clause_id=prev_dep.policy_clause_id,
                    regulation_clause_id=new_clause.id,
                    confidence_score=prev_dep.confidence_score,
                    is_verified=prev_dep.is_verified,
                )
                db.add(new_dep)

        clauses_created.append(new_clause)

    # Record to audit ledger
    audit_entry = await record_audit_event(
        db=db,
        event_type="AMENDMENT_INGESTED",
        actor="regulatory_authority.ingestion",
        payload={
            "regulation_code": code,
            "version_tag": payload.version_tag,
            "published_date": payload.published_date.isoformat(),
            "clauses_count": len(payload.clauses),
            "version_id": str(new_version.id)
        }
    )

    # Telemetry broadcast
    await broadcaster.broadcast("AMENDMENT_DETECTED", {
        "regulation_code": code,
        "version_tag": payload.version_tag,
        "version_id": str(new_version.id),
        "audit_block": audit_entry.index,
        "clauses_count": len(payload.clauses)
    })

    await db.commit()
    await db.refresh(new_version)
    
    # Reload with clauses for response
    stmt = select(RegulationVersion).options(selectinload(RegulationVersion.clauses)).where(RegulationVersion.id == new_version.id)
    r = await db.execute(stmt)
    return r.scalar_one()
