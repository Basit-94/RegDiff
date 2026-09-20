import pytest
from backend.app.core.database import AsyncSessionLocal, init_db
from backend.app.services.audit_service import record_audit_event, verify_chain_integrity

@pytest.mark.asyncio
async def test_audit_ledger_integrity():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Record a series of chained events
        b1 = await record_audit_event(
            db=db,
            event_type="TEST_EVENT_1",
            actor="test_runner",
            payload={"action": "test1"}
        )
        assert b1.index >= 1
        assert len(b1.current_hash) == 64

        b2 = await record_audit_event(
            db=db,
            event_type="TEST_EVENT_2",
            actor="test_runner",
            payload={"action": "test2"}
        )
        assert b2.previous_hash == b1.current_hash

        valid, error, count = await verify_chain_integrity(db)
        assert valid is True
        assert error is None
        assert count >= 2
