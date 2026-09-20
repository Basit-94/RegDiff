import pytest
from backend.app.engine.runner import evaluate_operator, evaluate_policy_assertion
from backend.app.engine.parser import calculate_sha256, extract_parameters, segment_regulatory_text

def test_evaluate_operator_numeric():
    # <= tests
    assert evaluate_operator(30, "<=", 90) is True
    assert evaluate_operator(90, "<=", 90) is True
    assert evaluate_operator(91, "<=", 90) is False

    # >= tests
    assert evaluate_operator(500, ">=", 500) is True
    assert evaluate_operator(499, ">=", 500) is False

    # == and !=
    assert evaluate_operator(100, "==", "100") is True
    assert evaluate_operator(100, "!=", "200") is True

def test_evaluate_operator_boolean():
    assert evaluate_operator(True, "==", "true") is True
    assert evaluate_operator(False, "==", "false") is True
    assert evaluate_operator(False, "==", "true") is False
    assert evaluate_operator("true", "==", "true") is True

def test_cfpb_assertion_deterministic_break():
    # 90 days in policy against 30 day limit -> MUST FAIL DETERMINISTICALLY
    policy_text = (
        "All authorized consumer financial records, transactional histories, and authentication query "
        "logs shall be retained in active data stores for a period of ninety (90) days following user session invalidation."
    )
    result = evaluate_policy_assertion(
        policy_text=policy_text,
        parameter_key="max_data_retention_days",
        operator="<=",
        expected_value="30",
        error_message="Retention period exceeds maximum statutory cap of 30 days."
    )
    assert result.passed is False
    assert result.observed_value == 90
    assert result.severity == "CRITICAL"
    assert "Retention period exceeds maximum statutory cap of 30 days" in result.error_message

def test_cfpb_assertion_pass():
    # Remediated policy with 30 days -> MUST PASS DETERMINISTICALLY
    remediated_policy = (
        "All authorized consumer financial records, transactional histories, and authentication query "
        "logs shall be retained in active data stores for a duration not to exceed thirty (30) days."
    )
    result = evaluate_policy_assertion(
        policy_text=remediated_policy,
        parameter_key="max_data_retention_days",
        operator="<=",
        expected_value="30",
        error_message="Retention period exceeds maximum statutory cap of 30 days."
    )
    assert result.passed is True
    assert result.observed_value == 30

def test_eu_ai_act_assertion_deterministic_break():
    # Autonomous credit scoring without kill switch -> MUST FAIL
    policy_text = (
        "The automated credit decision scoring service operates autonomously. "
        "System-level manual overrides are reviewed asynchronously via administrative ticket queues within two (2) business hours."
    )
    # Check override capability
    res1 = evaluate_policy_assertion(
        policy_text=policy_text,
        parameter_key="human_override_capability",
        operator="==",
        expected_value="true",
        error_message="High-risk AI system lacks mandatory human override capability."
    )
    assert res1.passed is False
    assert res1.observed_value is False

    # Check override latency
    res2 = evaluate_policy_assertion(
        policy_text=policy_text,
        parameter_key="max_override_latency_ms",
        operator="<=",
        expected_value="500",
        error_message="Human override latency exceeds maximum allowable threshold of 500ms."
    )
    assert res2.passed is False
    assert res2.observed_value == 7200000

def test_sha256_reproducibility():
    text1 = "Covered entities shall retain authorized consumer financial transaction records"
    hash1 = calculate_sha256(text1)
    hash2 = calculate_sha256(text1)
    assert hash1 == hash2
    assert len(hash1) == 64
