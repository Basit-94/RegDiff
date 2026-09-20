from typing import Any, Dict, List, Optional, Tuple
from backend.app.engine.parser import extract_parameters

def evaluate_operator(observed: Any, operator: str, expected: Any) -> bool:
    """
    Pure deterministic comparison engine.
    Supports <=, >=, ==, !=, <, > with type normalization.
    """
    # 1. Normalize booleans
    if isinstance(expected, str) and expected.lower() in ("true", "false"):
        expected_bool = expected.lower() == "true"
        observed_bool = bool(observed) if not isinstance(observed, str) else observed.lower() == "true"
        if operator == "==":
            return observed_bool == expected_bool
        elif operator == "!=":
            return observed_bool != expected_bool
        return False

    # 2. Try numeric comparison
    try:
        obs_num = float(observed)
        exp_num = float(expected)
        if operator == "<=":
            return obs_num <= exp_num
        elif operator == ">=":
            return obs_num >= exp_num
        elif operator == "==":
            return obs_num == exp_num
        elif operator == "!=":
            return obs_num != exp_num
        elif operator == "<":
            return obs_num < exp_num
        elif operator == ">":
            return obs_num > exp_num
        else:
            raise ValueError(f"Unsupported operator: {operator}")
    except (ValueError, TypeError):
        # 3. Fallback to string comparison
        obs_str = str(observed).strip().lower() if observed is not None else ""
        exp_str = str(expected).strip().lower()
        if operator == "==":
            return obs_str == exp_str
        elif operator == "!=":
            return obs_str != exp_str
        elif operator == "<=":
            return obs_str <= exp_str
        elif operator == ">=":
            return obs_str >= exp_str
        return False

class AssertionResult:
    def __init__(
        self,
        passed: bool,
        parameter_key: str,
        operator: str,
        expected_value: str,
        observed_value: Any,
        error_message: str,
        severity: str = "CRITICAL"
    ):
        self.passed = passed
        self.parameter_key = parameter_key
        self.operator = operator
        self.expected_value = expected_value
        self.observed_value = observed_value
        self.error_message = error_message
        self.severity = severity

    def to_dict(self) -> Dict[str, Any]:
        return {
            "passed": self.passed,
            "parameter_key": self.parameter_key,
            "operator": self.operator,
            "expected_value": self.expected_value,
            "observed_value": self.observed_value,
            "error_message": self.error_message,
            "severity": self.severity
        }

def evaluate_policy_assertion(
    policy_text: str,
    parameter_key: str,
    operator: str,
    expected_value: str,
    error_message: str,
    override_params: Optional[Dict[str, Any]] = None
) -> AssertionResult:
    """
    Deterministically evaluates a policy against a single rule assertion.
    """
    extracted = extract_parameters(policy_text)
    if override_params:
        extracted.update(override_params)

    observed = extracted.get(parameter_key)
    if observed is None:
        # Missing required parameter is a deterministic violation
        return AssertionResult(
            passed=False,
            parameter_key=parameter_key,
            operator=operator,
            expected_value=expected_value,
            observed_value=None,
            error_message=f"{error_message} (Parameter '{parameter_key}' not specified or detectable)",
            severity="CRITICAL"
        )

    is_compliant = evaluate_operator(observed, operator, expected_value)
    return AssertionResult(
        passed=is_compliant,
        parameter_key=parameter_key,
        operator=operator,
        expected_value=expected_value,
        observed_value=observed,
        error_message=error_message if not is_compliant else "",
        severity="CRITICAL" if not is_compliant else "INFO"
    )
