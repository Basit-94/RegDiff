import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.app.core.database import init_db

@pytest.mark.asyncio
async def test_gdpr_compliance_check():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Breach: 14 business days notification
        res = await ac.post("/api/v1/policies/analyze_text", json={
            "text": "The security team will investigate and notify supervisory authorities within fourteen (14) business days.",
            "framework_id": "gdpr"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["compliant"] is False
        assert len(data["violations"]) >= 1
        assert "72" in data["remediated_text"] or "seventy-two" in data["remediated_text"]

@pytest.mark.asyncio
async def test_hipaa_compliance_check():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Breach: standard unencrypted storage
        res = await ac.post("/api/v1/policies/analyze_text", json={
            "text": "Patient health records in secondary analytics may use standard unencrypted storage with disclosure in 90 days.",
            "framework_id": "hipaa"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["compliant"] is False
        assert "AES-256" in data["remediated_text"] or "164.312" in data["remediated_text"]

@pytest.mark.asyncio
async def test_ccpa_compliance_check():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Breach: 90 days for consumer requests
        res = await ac.post("/api/v1/policies/analyze_text", json={
            "text": "Consumer requests for data deletion or access will be fulfilled within ninety (90) calendar days.",
            "framework_id": "ccpa"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["compliant"] is False
        assert "45" in data["remediated_text"] or "forty-five" in data["remediated_text"]

@pytest.mark.asyncio
async def test_omni_audit_endpoint():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/policies/omni_audit", json={
            "text": "Customer telemetry records shall be retained for ninety (90) calendar days following user offboarding.",
            "doc_title": "Enterprise Retention SOP"
        })
        assert res.status_code == 200
        data = res.json()
        assert "overall_score" in data
        assert data["total_statutes"] == 6
        assert len(data["matrix"]) == 6
