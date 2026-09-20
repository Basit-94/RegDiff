import pytest
from backend.app.services.patch_service import draft_compliance_patch, summarize_regulatory_delta, generate_unified_diff

@pytest.mark.asyncio
async def test_patch_generation_cfpb_retention():
    statutory_text = (
        "Covered entities shall retain authorized consumer financial transaction records and "
        "associated query logs for an operational duration not to exceed thirty (30) calendar days."
    )
    policy_text = (
        "All authorized consumer financial records, transactional histories, and authentication "
        "query logs shall be retained in active data stores for a period of ninety (90) days following user session invalidation."
    )
    patch_result = await draft_compliance_patch(
        statutory_text=statutory_text,
        policy_text=policy_text,
        parameter_key="max_data_retention_days",
        expected_value="30",
        rule_error_message="Retention period exceeds maximum statutory cap of 30 days under CFPB 1033.351(a)(1)."
    )

    assert "thirty (30) days" in patch_result["proposed_patch"] or "30 days" in patch_result["proposed_patch"]
    assert "diff_unified" in patch_result
    assert "---" in patch_result["diff_unified"] and "+++" in patch_result["diff_unified"]
    assert patch_result["confidence_score"] >= 0.90
    assert len(patch_result["rationale"]) > 0

def test_executive_summary_cfpb():
    summary = summarize_regulatory_delta(
        statutory_diff="CFPB Rule 1033 Retention delta",
        failed_assertion_msg="Retention period exceeds maximum statutory cap of 30 days.",
        framework_name="CFPB-1033"
    )
    assert "CFPB Rule 1033" in summary
    assert "30 calendar days" in summary
    assert "penalties" in summary or "exposure" in summary
