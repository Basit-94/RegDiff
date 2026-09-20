from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.app.models.models import Regulation, RegulationVersion, RegulationClause, RuleAssertion
from backend.app.engine.runner import evaluate_operator
from backend.app.services.audit_service import record_audit_event
from backend.app.core.telemetry import broadcaster

async def evaluate_mcp_compliance(
    db: AsyncSession,
    action_type: str,
    target_jurisdiction: str,
    parameters: Dict[str, Any],
    actor: str = "mcp.autonomous_agent"
) -> Dict[str, Any]:
    """
    Deterministic compliance check exposed to autonomous agents via MCP.
    Validates operational arguments directly against active statutory assertions.
    Logs every check (pass or reject) to the SHA-256 audit ledger.
    """
    # 1. Resolve relevant regulation based on jurisdiction/action
    jurisdiction_upper = (target_jurisdiction or "").upper()
    action_upper = (action_type or "").upper()

    if "GDPR" in jurisdiction_upper or "GDPR" in action_upper:
        reg_code = "GDPR-2016"
    elif "HIPAA" in jurisdiction_upper or "HEALTH" in action_upper or "HHS" in jurisdiction_upper:
        reg_code = "HIPAA-164"
    elif "CCPA" in jurisdiction_upper or "CALIFORNIA" in jurisdiction_upper:
        reg_code = "CCPA-1798"
    elif "NYDFS" in jurisdiction_upper or "CYBER" in action_upper:
        reg_code = "NYDFS-500"
    elif "EU_ACT" in jurisdiction_upper or "MODEL_INFERENCE" in action_upper or "AI" in action_upper:
        reg_code = "EU-AI-ACT"
    else:
        reg_code = "CFPB-1033"

    stmt = (
        select(Regulation)
        .options(
            selectinload(Regulation.versions).selectinload(RegulationVersion.clauses).selectinload(RegulationClause.assertions)
        )
        .where(Regulation.code == reg_code)
    )
    res = await db.execute(stmt)
    reg = res.scalar_one_or_none()

    violations = []

    # If regulation and assertions exist in DB, evaluate against DB assertions
    active_version = None
    if reg:
        active_version = next((v for v in reg.versions if v.is_active), None)
        if not active_version and reg.versions:
            active_version = reg.versions[-1]

    if active_version and active_version.clauses:
        for clause in active_version.clauses:
            for rule in clause.assertions:
                # Check retention limit (CFPB / NYDFS)
                if rule.parameter_key in ("max_data_retention_days", "retention_period_days"):
                    req_days = parameters.get("retention_period_days") or parameters.get("max_data_retention_days")
                    if req_days is not None:
                        is_ok = evaluate_operator(req_days, rule.operator, rule.expected_value)
                        if not is_ok:
                            violations.append({
                                "clause": clause.clause_identifier,
                                "parameter": rule.parameter_key,
                                "observed": req_days,
                                "statutory_limit": rule.expected_value,
                                "error": f"Retention period ({req_days} days) violates statutory cap ({rule.expected_value} days) under {clause.clause_identifier}."
                            })

                # Check override capability (EU AI Act)
                if rule.parameter_key == "human_override_capability":
                    mech = parameters.get("human_oversight_mechanism")
                    override_cap = parameters.get("human_override_capability")
                    has_override = override_cap is True or (mech and "kill-switch" in str(mech).lower())
                    is_ok = evaluate_operator(has_override, rule.operator, rule.expected_value)
                    if not is_ok:
                        violations.append({
                            "clause": clause.clause_identifier,
                            "parameter": rule.parameter_key,
                            "observed": has_override,
                            "statutory_limit": rule.expected_value,
                            "error": f"High-risk AI operation lacks mandatory synchronous kill-switch under {clause.clause_identifier}."
                        })

                # Check override latency (EU AI Act)
                if rule.parameter_key == "max_override_latency_ms":
                    lat = parameters.get("override_latency_ms") or parameters.get("max_override_latency_ms")
                    if lat is not None:
                        is_ok = evaluate_operator(lat, rule.operator, rule.expected_value)
                        if not is_ok:
                            violations.append({
                                "clause": clause.clause_identifier,
                                "parameter": rule.parameter_key,
                                "observed": lat,
                                "statutory_limit": rule.expected_value,
                                "error": f"Override latency ({lat}ms) exceeds statutory ceiling ({rule.expected_value}ms) under {clause.clause_identifier}."
                            })

                # Check audit retention (NYDFS)
                if rule.parameter_key == "min_audit_log_retention_days":
                    log_days = parameters.get("min_audit_log_retention_days")
                    if log_days is not None:
                        is_ok = evaluate_operator(log_days, rule.operator, rule.expected_value)
                        if not is_ok:
                            violations.append({
                                "clause": clause.clause_identifier,
                                "parameter": rule.parameter_key,
                                "observed": log_days,
                                "statutory_limit": rule.expected_value,
                                "error": f"Audit log retention ({log_days} days) is below mandatory 3-year floor ({rule.expected_value} days) under {clause.clause_identifier}."
                            })

                # Check GDPR Breach Notice Hours
                if rule.parameter_key == "max_breach_notice_hours":
                    hrs = parameters.get("max_breach_notice_hours")
                    if hrs is not None:
                        is_ok = evaluate_operator(hrs, rule.operator, rule.expected_value)
                        if not is_ok:
                            violations.append({
                                "clause": clause.clause_identifier,
                                "parameter": rule.parameter_key,
                                "observed": hrs,
                                "statutory_limit": rule.expected_value,
                                "error": f"Supervisory breach notification timeline ({hrs} hrs) exceeds mandatory 72-hour ceiling under {clause.clause_identifier}."
                            })

                # Check HIPAA Encryption
                if rule.parameter_key == "ephi_encryption_enforced":
                    enc = parameters.get("ephi_encryption_enforced")
                    if enc is not None:
                        is_ok = evaluate_operator(enc, rule.operator, rule.expected_value)
                        if not is_ok:
                            violations.append({
                                "clause": clause.clause_identifier,
                                "parameter": rule.parameter_key,
                                "observed": "Unencrypted" if enc is False else str(enc),
                                "statutory_limit": "AES-256 Mandatory",
                                "error": f"Electronic Protected Health Information (ePHI) storage lacks mandatory AES-256 encryption under {clause.clause_identifier}."
                            })

                # Check CCPA Consumer Request Days
                if rule.parameter_key == "max_consumer_request_days":
                    c_days = parameters.get("max_consumer_request_days")
                    if c_days is not None:
                        is_ok = evaluate_operator(c_days, rule.operator, rule.expected_value)
                        if not is_ok:
                            violations.append({
                                "clause": clause.clause_identifier,
                                "parameter": rule.parameter_key,
                                "observed": c_days,
                                "statutory_limit": rule.expected_value,
                                "error": f"Consumer rights request fulfillment timeframe ({c_days} days) exceeds California 45-day statutory ceiling under {clause.clause_identifier}."
                            })

    # Direct fallback checks if DB rows not yet migrated
    if not violations:
        if reg_code == "GDPR-2016":
            hrs = parameters.get("max_breach_notice_hours")
            if hrs is not None and hrs > 72:
                violations.append({
                    "clause": "GDPR Article 33(1)",
                    "parameter": "max_breach_notice_hours",
                    "observed": hrs,
                    "statutory_limit": 72,
                    "error": f"Breach notification timeline ({hrs} hours) exceeds GDPR 72-hour statutory ceiling under Article 33(1)."
                })
        elif reg_code == "HIPAA-164":
            enc = parameters.get("ephi_encryption_enforced")
            if enc is False:
                violations.append({
                    "clause": "45 CFR § 164.312(a)(2)(iv)",
                    "parameter": "ephi_encryption_enforced",
                    "observed": "Unencrypted storage",
                    "statutory_limit": "AES-256 Enforced",
                    "error": "ePHI stored unencrypted in secondary storage in direct violation of 45 CFR § 164.312(a)(2)(iv)."
                })
            b_days = parameters.get("max_breach_notice_days")
            if b_days is not None and b_days > 60:
                violations.append({
                    "clause": "45 CFR § 164.404",
                    "parameter": "max_breach_notice_days",
                    "observed": b_days,
                    "statutory_limit": 60,
                    "error": f"Breach disclosure timeline ({b_days} days) exceeds HHS 60-day statutory limit under 45 CFR § 164.404."
                })
        elif reg_code == "CCPA-1798":
            c_days = parameters.get("max_consumer_request_days")
            if c_days is not None and c_days > 45:
                violations.append({
                    "clause": "Cal. Civ. Code § 1798.130",
                    "parameter": "max_consumer_request_days",
                    "observed": c_days,
                    "statutory_limit": 45,
                    "error": f"Consumer privacy request SLA ({c_days} days) exceeds 45-day statutory cap under Cal. Civ. Code § 1798.130."
                })
        elif reg_code == "NYDFS-500":
            l_days = parameters.get("min_audit_log_retention_days") or parameters.get("retention_period_days")
            if l_days is not None and l_days < 1095:
                violations.append({
                    "clause": "23 NYCRR § 500.06",
                    "parameter": "min_audit_log_retention_days",
                    "observed": l_days,
                    "statutory_limit": 1095,
                    "error": f"Audit trail retention ({l_days} days) fails mandatory 3-year (1,095 days) floor under 23 NYCRR § 500.06."
                })
        elif reg_code == "CFPB-1033":
            r_days = parameters.get("retention_period_days") or parameters.get("max_data_retention_days")
            if r_days is not None and r_days > 30:
                violations.append({
                    "clause": "12 CFR § 1033.351(a)(1)",
                    "parameter": "max_data_retention_days",
                    "observed": r_days,
                    "statutory_limit": 30,
                    "error": f"Data retention window ({r_days} days) exceeds statutory ceiling (30 days) under 12 CFR § 1033.351(a)(1)."
                })
        elif reg_code == "EU-AI-ACT":
            override = parameters.get("human_override_capability")
            lat = parameters.get("override_latency_ms") or parameters.get("max_override_latency_ms")
            if override is False or (lat is not None and lat > 500):
                violations.append({
                    "clause": "EU Regulation 2024/1689 • Art. 14(4)(a)",
                    "parameter": "human_override_capability",
                    "observed": f"latency: {lat}ms, kill-switch: {override}",
                    "statutory_limit": "<=500ms synchronous kill-switch",
                    "error": "Automated AI system lacks required synchronous kill-switch (<=500ms) under EU AI Act Article 14(4)(a)."
                })

    is_compliant = len(violations) == 0
    verdict_status = "APPROVED" if is_compliant else "REJECTED"

    # Log to cryptographic audit ledger
    audit_entry = await record_audit_event(
        db=db,
        event_type="MCP_COMPLIANCE_CHECK",
        actor=actor,
        payload={
            "action_type": action_type,
            "target_jurisdiction": target_jurisdiction,
            "parameters": parameters,
            "verdict": verdict_status,
            "violations_count": len(violations),
            "violations": violations,
        }
    )

    await broadcaster.broadcast("AUDIT_BLOCK_MINED", {
        "block_index": audit_entry.index,
        "current_hash": audit_entry.current_hash,
        "event_type": f"MCP_{verdict_status}",
        "actor": actor
    })

    return {
        "compliant": is_compliant,
        "status": verdict_status,
        "jurisdiction": target_jurisdiction,
        "framework": reg.code if reg else reg_code,
        "version_tag": active_version.version_tag if active_version else "NONE",
        "violations": violations,
        "audit_block_index": audit_entry.index,
        "audit_hash": audit_entry.current_hash,
        "message": (
            "All statutory compliance constraints satisfied. Operation permitted."
            if is_compliant
            else f"Compliance check FAILED: {violations[0]['error']}"
        )
    }
