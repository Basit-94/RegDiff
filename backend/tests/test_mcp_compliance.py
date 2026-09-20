import pytest
from backend.app.core.database import AsyncSessionLocal, init_db
from backend.app.mcp.compliance_checker import evaluate_mcp_compliance
from backend.app.services.audit_service import verify_chain_integrity, record_audit_event
from backend.app.models.models import AuditLedger
from sqlalchemy import select, desc

@pytest.mark.asyncio
async def test_mcp_compliance_rejection_over_cap():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Agent attempts data storage with 120-day retention -> MUST BE REJECTED
        result = await evaluate_mcp_compliance(
            db=db,
            action_type="DATA_STORAGE",
            target_jurisdiction="US_CFPB",
            parameters={"retention_period_days": 120},
            actor="agent.autonomous_rag"
        )
        assert result["compliant"] is False
        assert result["status"] == "REJECTED"
        assert len(result["violations"]) > 0
        assert "violates statutory cap" in result["violations"][0]["error"]
        assert result["audit_block_index"] > 0
        assert len(result["audit_hash"]) == 64

@pytest.mark.asyncio
async def test_mcp_compliance_approval_under_cap():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Agent attempts data storage with 15-day retention -> MUST BE APPROVED
        result = await evaluate_mcp_compliance(
            db=db,
            action_type="DATA_STORAGE",
            target_jurisdiction="US_CFPB",
            parameters={"retention_period_days": 15},
            actor="agent.autonomous_rag"
        )
        assert result["compliant"] is True
        assert result["status"] == "APPROVED"
        assert len(result["violations"]) == 0
        assert result["audit_block_index"] > 0

@pytest.mark.asyncio
async def test_mcp_compliance_ai_act_rejection():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Agent requests credit model inference with 2000ms latency and no kill switch
        result = await evaluate_mcp_compliance(
            db=db,
            action_type="MODEL_INFERENCE",
            target_jurisdiction="EU_ACT",
            parameters={
                "human_override_capability": False,
                "override_latency_ms": 2000
            },
            actor="agent.credit_agent"
        )
        assert result["compliant"] is False
        assert result["status"] == "REJECTED"
        assert len(result["violations"]) >= 1

@pytest.mark.asyncio
async def test_audit_ledger_tamper_detection():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Chain should currently be intact
        valid, err, count = await verify_chain_integrity(db)
        assert valid is True

        # Maliciously tamper with the latest block's payload
        stmt = select(AuditLedger).order_by(desc(AuditLedger.index)).limit(1)
        res = await db.execute(stmt)
        latest = res.scalar_one()
        original_payload = dict(latest.payload)
        
        # Mutate payload without recalculating current_hash
        latest.payload = {"tampered": "unauthorized modification"}
        await db.commit()

        # Integrity verification MUST FAIL
        tampered_valid, tampered_err, _ = await verify_chain_integrity(db)
        assert tampered_valid is False
        assert "Checksum mismatch" in tampered_err

        # Restore original payload to keep ledger valid
        latest.payload = original_payload
        await db.commit()
        restored_valid, _, _ = await verify_chain_integrity(db)
        assert restored_valid is True
