import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from backend.main import app
from backend.app.core.database import init_db, AsyncSessionLocal
from backend.app.models.models import PolicyClause

@pytest.mark.asyncio
async def test_full_amendment_regression_remediation_lifecycle():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Ensure sample policy and dependency exist
        await client.post("/api/v1/policies/load_sample_suite")

        # Reset policy clause to original non-compliant state (90 days)
        async with AsyncSessionLocal() as db:
            stmt = select(PolicyClause).where(PolicyClause.section_label == "Section 4.2 - Token Retention Lifecycle")
            res = await db.execute(stmt)
            pol_clauses = res.scalars().all()
            for pol_clause in pol_clauses:
                pol_clause.body_text = (
                    "All authorized consumer financial records, transactional histories, and authentication query logs "
                    "shall be retained in active data stores for a period of ninety (90) days following user session invalidation "
                    "to facilitate customer support reconciliation."
                )
            await db.commit()
        # Step 1: Ingest statutory amendment reducing retention to 30 days
        amend_payload = {
            "version_tag": "v2026.3.0-REV",
            "published_date": "2026-09-15",
            "clauses": [
                {
                    "clause_identifier": "1033.351(a)(1)",
                    "clause_title": "Maximum Retention Limit for Consumer Auth Data",
                    "clause_text": (
                        "Covered entities shall retain authorized consumer financial transaction records and "
                        "associated query logs for an operational duration not to exceed thirty (30) calendar days "
                        "following token invalidation or explicit consumer consent revocation."
                    )
                }
            ]
        }
        amend_res = await client.post("/api/v1/regulations/CFPB-1033/amend", json=amend_payload)
        assert amend_res.status_code == 201
        amended_version = amend_res.json()
        version_id = amended_version["id"]
        assert amended_version["version_tag"] == "v2026.3.0-REV"

        # Step 2: Trigger regression run
        run_res = await client.post("/api/v1/runs/execute", json={"regulation_version_id": version_id})
        assert run_res.status_code == 201
        run_data = run_res.json()

        # Step 3: Verify failure detected
        assert run_data["status"] == "CRITICAL_BREAK"
        summary = run_data["summary_report"]
        assert summary["failed_assertions"] >= 1
        assert len(run_data["patches"]) >= 1

        patch = run_data["patches"][0]
        patch_id = patch["id"]
        assert patch["status"] == "PROPOSED"
        assert "thirty (30) days" in patch["proposed_patch"] or "30 days" in patch["proposed_patch"]
        assert "---" in patch["diff_unified"] and "+++" in patch["diff_unified"]

        # Step 4: Apply remediation patch
        apply_res = await client.post(f"/api/v1/patches/{patch_id}/apply", json={
            "status": "APPLIED",
            "reviewer_notes": "Approved per updated CFPB Rule 1033 requirements."
        })
        assert apply_res.status_code == 200
        applied_patch = apply_res.json()
        assert applied_patch["status"] == "APPLIED"

        # Step 5: Verify policy status is now COMPLIANT
        pol_res = await client.get("/api/v1/policies")
        assert pol_res.status_code == 200
        policies = pol_res.json()
        cfpb_policy = next((p for p in policies if "Core Banking" in p["title"]), None)
        assert cfpb_policy is not None
        assert cfpb_policy["current_status"] == "COMPLIANT"

        # Step 6: Verify ledger integrity
        ledger_res = await client.get("/api/v1/ledger/verify")
        assert ledger_res.status_code == 200
        assert ledger_res.json()["is_valid"] is True
