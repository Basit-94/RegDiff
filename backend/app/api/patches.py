import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db
from backend.app.models.models import PolicyPatch, PolicyClause, EnterprisePolicy
from backend.app.schemas import PatchApplyRequest, PolicyPatchResponse
from backend.app.engine.parser import calculate_sha256
from backend.app.services.audit_service import record_audit_event
from backend.app.core.telemetry import broadcaster

router = APIRouter(prefix="/patches", tags=["Patches"])

@router.get("", response_model=List[PolicyPatchResponse])
async def list_patches(db: AsyncSession = Depends(get_db)):
    stmt = select(PolicyPatch).order_by(PolicyPatch.confidence_score.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{patch_id}", response_model=PolicyPatchResponse)
async def get_patch(patch_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(PolicyPatch).where(PolicyPatch.id == patch_id)
    result = await db.execute(stmt)
    patch = result.scalar_one_or_none()
    if not patch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"type": "NOT_FOUND", "title": "Patch Not Found", "detail": f"Patch {patch_id} not found"}
        )
    return patch

@router.post("/{patch_id}/apply", response_model=PolicyPatchResponse)
async def apply_patch(
    patch_id: uuid.UUID,
    payload: PatchApplyRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(PolicyPatch)
        .options(selectinload(PolicyPatch.policy_clause).selectinload(PolicyClause.policy))
        .where(PolicyPatch.id == patch_id)
    )
    result = await db.execute(stmt)
    patch = result.scalar_one_or_none()
    if not patch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"type": "NOT_FOUND", "title": "Patch Not Found", "detail": f"Patch {patch_id} not found"}
        )

    if payload.status == "APPLIED":
        pol_clause = patch.policy_clause
        if pol_clause:
            pol_clause.body_text = patch.proposed_patch
            pol_clause.content_hash = calculate_sha256(patch.proposed_patch)
            if pol_clause.policy:
                pol_clause.policy.current_status = "COMPLIANT"

        patch.status = "APPLIED"

        # Record commit to cryptographic audit ledger
        audit_entry = await record_audit_event(
            db=db,
            event_type="PATCH_APPLIED",
            actor="compliance_officer.human_review",
            payload={
                "patch_id": str(patch.id),
                "policy_clause_id": str(patch.policy_clause_id),
                "reviewer_notes": payload.reviewer_notes or "Approved per updated statutory requirements.",
                "confidence_score": patch.confidence_score,
                "new_hash": pol_clause.content_hash if pol_clause else "",
            }
        )

        await broadcaster.broadcast("AUDIT_BLOCK_MINED", {
            "block_index": audit_entry.index,
            "current_hash": audit_entry.current_hash,
            "event_type": "PATCH_APPLIED",
            "patch_id": str(patch.id)
        })

    elif payload.status == "REJECTED":
        patch.status = "REJECTED"
        await record_audit_event(
            db=db,
            event_type="PATCH_REJECTED",
            actor="compliance_officer.human_review",
            payload={
                "patch_id": str(patch.id),
                "policy_clause_id": str(patch.policy_clause_id),
                "reviewer_notes": payload.reviewer_notes or "Rejected by reviewer.",
            }
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"type": "INVALID_STATUS", "title": "Invalid Status", "detail": "Status must be APPLIED or REJECTED"}
        )

    await db.commit()
    await db.refresh(patch)
    return patch
