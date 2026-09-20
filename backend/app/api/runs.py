import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db
from backend.app.models.models import RegressionRun, PolicyPatch
from backend.app.schemas import RunExecuteRequest, RegressionRunResponse
from backend.app.engine.regression_runner import execute_regression_run

router = APIRouter(prefix="/runs", tags=["Runs"])

@router.post("/execute", response_model=RegressionRunResponse, status_code=status.HTTP_201_CREATED)
async def trigger_regression_run(
    payload: RunExecuteRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Executes a deterministic compliance regression run over all policies
    dependent on the supplied regulation version.
    """
    try:
        run = await execute_regression_run(
            db=db,
            regulation_version_id=payload.regulation_version_id,
            actor="compliance_officer.manual_trigger"
        )
        # Reload with patches for response serialization
        stmt = (
            select(RegressionRun)
            .options(selectinload(RegressionRun.patches))
            .where(RegressionRun.id == run.id)
        )
        res = await db.execute(stmt)
        return res.scalar_one()
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"type": "BAD_REQUEST", "title": "Run Execution Failed", "detail": str(e)}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"type": "INTERNAL_ERROR", "title": "Run Error", "detail": str(e)}
        )

@router.get("", response_model=List[RegressionRunResponse])
async def list_runs(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(RegressionRun)
        .options(selectinload(RegressionRun.patches))
        .order_by(desc(RegressionRun.executed_at))
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{run_id}", response_model=RegressionRunResponse)
async def get_run(run_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(RegressionRun)
        .options(selectinload(RegressionRun.patches))
        .where(RegressionRun.id == run_id)
    )
    result = await db.execute(stmt)
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"type": "NOT_FOUND", "title": "Run Not Found", "detail": f"Regression run {run_id} not found"}
        )
    return run
