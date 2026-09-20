import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.app.models.models import (
    RegulationVersion,
    RegulationClause,
    EnterprisePolicy,
    PolicyClause,
    PolicyDependency,
    RuleAssertion,
    RegressionRun,
    PolicyPatch,
)
from backend.app.engine.runner import evaluate_policy_assertion
from backend.app.services.patch_service import draft_compliance_patch, summarize_regulatory_delta
from backend.app.services.audit_service import record_audit_event
from backend.app.core.telemetry import broadcaster

async def execute_regression_run(
    db: AsyncSession,
    regulation_version_id: uuid.UUID,
    actor: str = "regression_runner.ci"
) -> RegressionRun:
    """
    Executes a full deterministic compliance regression walk over all policies
    dependent on clauses in the specified regulation version.
    """
    # 1. Load regulation version with clauses and assertions
    v_stmt = (
        select(RegulationVersion)
        .options(
            selectinload(RegulationVersion.clauses).selectinload(RegulationClause.assertions),
            selectinload(RegulationVersion.clauses).selectinload(RegulationClause.dependencies).selectinload(PolicyDependency.policy_clause).selectinload(PolicyClause.policy),
            selectinload(RegulationVersion.regulation)
        )
        .where(RegulationVersion.id == regulation_version_id)
    )
    v_result = await db.execute(v_stmt)
    version = v_result.scalar_one_or_none()
    if not version:
        raise ValueError(f"RegulationVersion with id {regulation_version_id} not found")

    # Broadcast RUN_STARTED
    run_id = uuid.uuid4()
    await broadcaster.broadcast("RUN_STARTED", {
        "run_id": str(run_id),
        "regulation_code": version.regulation.code if version.regulation else "UNKNOWN",
        "version_tag": version.version_tag,
        "clause_count": len(version.clauses),
    })

    # Create run entry
    run = RegressionRun(
        id=run_id,
        trigger_regulation_version_id=regulation_version_id,
        status="IN_PROGRESS",
        executed_at=datetime.now(timezone.utc)
    )
    db.add(run)
    await db.flush()

    total_checks = 0
    passed_checks = 0
    failed_checks = 0
    patches_created: List[PolicyPatch] = []
    failed_details = []

    # 2. Dependency walk
    for reg_clause in version.clauses:
        # Check rule assertions configured for this statutory clause
        assertions = reg_clause.assertions
        if not assertions:
            continue

        for dep in reg_clause.dependencies:
            pol_clause = dep.policy_clause
            if not pol_clause:
                continue

            policy = pol_clause.policy

            for rule in assertions:
                total_checks += 1
                result = evaluate_policy_assertion(
                    policy_text=pol_clause.body_text,
                    parameter_key=rule.parameter_key,
                    operator=rule.operator,
                    expected_value=rule.expected_value,
                    error_message=rule.error_message
                )

                if result.passed:
                    passed_checks += 1
                else:
                    failed_checks += 1
                    failed_details.append({
                        "policy_id": str(policy.id) if policy else "",
                        "policy_title": policy.title if policy else "",
                        "section_label": pol_clause.section_label,
                        "parameter_key": rule.parameter_key,
                        "observed": result.observed_value,
                        "expected": rule.expected_value,
                        "error_message": result.error_message,
                    })

                    # Mark policy as CRITICAL_BREAK
                    if policy:
                        policy.current_status = "CRITICAL_BREAK"

                    # Broadcast ASSERTION_FAILED
                    await broadcaster.broadcast("ASSERTION_FAILED", {
                        "run_id": str(run_id),
                        "clause_identifier": reg_clause.clause_identifier,
                        "policy_clause": pol_clause.section_label,
                        "error_message": result.error_message,
                        "observed_value": result.observed_value,
                        "expected_value": rule.expected_value,
                    })

                    # 3. Draft surgical patch
                    patch_data = await draft_compliance_patch(
                        statutory_text=reg_clause.clause_text,
                        policy_text=pol_clause.body_text,
                        parameter_key=rule.parameter_key,
                        expected_value=rule.expected_value,
                        rule_error_message=result.error_message
                    )

                    patch = PolicyPatch(
                        id=uuid.uuid4(),
                        run_id=run.id,
                        policy_clause_id=pol_clause.id,
                        original_text=pol_clause.body_text,
                        proposed_patch=patch_data["proposed_patch"],
                        diff_unified=patch_data["diff_unified"],
                        rationale=patch_data["rationale"],
                        confidence_score=patch_data["confidence_score"],
                        status="PROPOSED"
                    )
                    db.add(patch)
                    patches_created.append(patch)

                    # Broadcast PATCH_READY
                    await broadcaster.broadcast("PATCH_READY", {
                        "patch_id": str(patch.id),
                        "run_id": str(run_id),
                        "policy_clause_id": str(pol_clause.id),
                        "diff_unified": patch.diff_unified,
                        "confidence_score": patch.confidence_score,
                    })

    # 4. Finalize run status
    run_status = "CRITICAL_BREAK" if failed_checks > 0 else "PASSED"
    exec_summary = summarize_regulatory_delta(
        statutory_diff=version.version_tag,
        failed_assertion_msg=failed_details[0]["error_message"] if failed_details else "All assertions satisfied.",
        framework_name=version.regulation.title if version.regulation else "Statutory Framework"
    )

    summary_report = {
        "regulation_code": version.regulation.code if version.regulation else "",
        "version_tag": version.version_tag,
        "total_dependencies_checked": total_checks,
        "passed_assertions": passed_checks,
        "failed_assertions": failed_checks,
        "patches_generated": len(patches_created),
        "failures": failed_details,
        "executive_summary": exec_summary,
    }

    run.status = run_status
    run.summary_report = summary_report
    await db.flush()

    # 5. Commit audit ledger entry
    audit_entry = await record_audit_event(
        db=db,
        event_type="REGRESSION_RUN_EXECUTED",
        actor=actor,
        payload={
            "run_id": str(run.id),
            "regulation_version_id": str(regulation_version_id),
            "status": run_status,
            "total_checks": total_checks,
            "failed_checks": failed_checks,
            "patches_count": len(patches_created),
        }
    )

    await broadcaster.broadcast("AUDIT_BLOCK_MINED", {
        "block_index": audit_entry.index,
        "current_hash": audit_entry.current_hash,
        "previous_hash": audit_entry.previous_hash,
        "event_type": audit_entry.event_type,
    })

    await db.commit()
    return run
