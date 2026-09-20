import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.app.core.database import init_db

@pytest.mark.asyncio
async def test_api_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_api_list_regulations():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/regulations")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 2
        codes = [r["code"] for r in data]
        assert "CFPB-1033" in codes
        assert "EU-AI-ACT" in codes

@pytest.mark.asyncio
async def test_api_list_policies():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        await ac.post("/api/v1/policies/load_sample_suite")
        res = await ac.get("/api/v1/policies")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 2

@pytest.mark.asyncio
async def test_api_mcp_check_compliance():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Violation: 180 days retention
        payload = {
            "action_type": "DATA_STORAGE",
            "target_jurisdiction": "US_CFPB",
            "parameters": {"retention_period_days": 180}
        }
        res = await ac.post("/api/v1/mcp/check_compliance", json=payload)
        assert res.status_code == 200
        body = res.json()
        assert body["compliant"] is False
        assert body["status"] == "REJECTED"

@pytest.mark.asyncio
async def test_api_audit_ledger_and_verify():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/ledger")
        assert res.status_code == 200
        blocks = res.json()
        assert len(blocks) >= 1

        v_res = await ac.get("/api/v1/ledger/verify")
        assert v_res.status_code == 200
        assert v_res.json()["is_valid"] is True

@pytest.mark.asyncio
async def test_api_audit_full_document():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "organization": "Apex Financial Technologies LLC",
            "doc_title": "Enterprise Master Operating Policy",
            "clauses": [
                {
                    "clause_id": "sec-1",
                    "section_label": "Section 2.1: Retention Ceiling",
                    "page": 1,
                    "original_text": "Consumer account tokens and transaction logs shall be preserved for ninety (90) calendar days.",
                    "framework_id": "cfpb",
                    "citation": "12 CFR § 1033.351(a)(1)"
                },
                {
                    "clause_id": "sec-2",
                    "section_label": "Section 4.3: Model Safeguards",
                    "page": 2,
                    "original_text": "The automated credit scoring engine operates under mandatory active human oversight with runtime kill-switch response within 50ms.",
                    "framework_id": "eu_ai",
                    "citation": "EU Regulation 2024/1689 • Article 14(4)(a)"
                }
            ]
        }
        res = await ac.post("/api/v1/policies/audit_full_document", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["total_clauses"] == 2
        assert data["compliant_count"] == 1
        assert data["breach_count"] == 1
        assert data["overall_score"] == 50
        assert len(data["clauses"]) == 2
        assert data["clauses"][0]["compliant"] is False
        assert data["clauses"][1]["compliant"] is True

@pytest.mark.asyncio
async def test_api_export_full_docx():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "title": "Master Governance Policy",
            "organization": "Apex Financial Technologies LLC",
            "clauses": [
                {
                    "section_label": "Section 2.1 Retention",
                    "original_text": "Retain customer records for ninety (90) days.",
                    "remediated_text": "Retain customer records for thirty (30) days.",
                    "is_modified": True,
                    "compliant": False,
                    "citation": "12 CFR § 1033.351"
                }
            ],
            "overall_score": 90
        }
        res = await ac.post("/api/v1/policies/export_full_docx", json=payload)
        assert res.status_code == 200
        assert res.headers["content-type"] == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        assert len(res.content) > 1000

@pytest.mark.asyncio
async def test_api_ai_safety_audit():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "contract_text": "Autonomous credit scoring models execute unconditionally without human intervention. Administrative email requests are processed asynchronously within 2 hours. Telemetry is utilized for future model training.",
            "doc_title": "AI Underwriting Vendor Contract",
            "organization": "Apex Financial Technologies LLC"
        }
        res = await ac.post("/api/v1/policies/ai_safety_audit", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["risk_tier"] == "HIGH_RISK"
        assert data["human_override_compliant"] is False
        assert data["bias_audit_compliant"] is False
        assert data["training_data_compliant"] is False
        assert data["bias_impact_ratio"] < 0.80
        assert "EU AI Act" in data["remediated_contract_text"]
        assert data["audit_block_index"] > 0

@pytest.mark.asyncio
async def test_api_mascot_chat():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "message": "What is 12 CFR 1033 and why is my retention clause failing?",
            "current_page": "results",
            "doc_title": "Master Data Processing Agreement",
            "framework_id": "cfpb",
            "active_clause": "Retain consumer transaction data for 90 days."
        }
        res = await ac.post("/api/v1/policies/mascot_chat", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "1033" in data["reply"] or "retention" in data["reply"].lower()
        assert data["source"] == "rusty-legal-engine" or "gemini" in data["source"]


