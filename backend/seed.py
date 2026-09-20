import asyncio
import uuid
from datetime import date, datetime, timezone
from sqlalchemy import select
from backend.app.core.database import AsyncSessionLocal, init_db
from backend.app.models.models import (
    Regulation,
    RegulationVersion,
    RegulationClause,
    EnterprisePolicy,
    PolicyClause,
    PolicyDependency,
    RuleAssertion,
    AuditLedger,
)
from backend.app.engine.parser import calculate_sha256
from backend.app.services.audit_service import record_audit_event

async def seed():
    print("Initializing tables...")
    await init_db()

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        result = await db.execute(select(Regulation))
        if result.scalars().first():
            print("Database already seeded. Skipping.")
            return

        print("Seeding Regulation 1: CFPB Rule 1033...")
        cfpb = Regulation(
            id=uuid.uuid4(),
            code="CFPB-1033",
            title="Personal Financial Data Rights",
            jurisdiction="US_CFPB",
        )
        db.add(cfpb)
        await db.flush()

        cfpb_v1 = RegulationVersion(
            id=uuid.uuid4(),
            regulation_id=cfpb.id,
            version_tag="v2026.1.0",
            published_date=date(2026, 1, 15),
            is_active=True,
        )
        db.add(cfpb_v1)
        await db.flush()

        cfpb_clause_text = (
            "Covered entities shall retain authorized consumer financial transaction records and "
            "associated query logs for an operational duration not to exceed ninety (90) calendar days "
            "following token invalidation or explicit consumer consent revocation."
        )
        cfpb_clause = RegulationClause(
            id=uuid.uuid4(),
            version_id=cfpb_v1.id,
            clause_identifier="1033.351(a)(1)",
            clause_title="Maximum Retention Limit for Consumer Auth Data",
            clause_text=cfpb_clause_text,
            content_hash=calculate_sha256(cfpb_clause_text),
        )
        db.add(cfpb_clause)
        await db.flush()

        cfpb_assertion = RuleAssertion(
            id=uuid.uuid4(),
            regulation_clause_id=cfpb_clause.id,
            parameter_key="max_data_retention_days",
            operator="<=",
            expected_value="90",
            error_message="Retention period exceeds maximum statutory cap of 90 days under CFPB 1033.351(a)(1).",
        )
        db.add(cfpb_assertion)

        print("Seeding Regulation 2: EU AI Act...")
        eu_ai = Regulation(
            id=uuid.uuid4(),
            code="EU-AI-ACT",
            title="European Artificial Intelligence Act",
            jurisdiction="EU_ACT",
        )
        db.add(eu_ai)
        await db.flush()

        eu_v1 = RegulationVersion(
            id=uuid.uuid4(),
            regulation_id=eu_ai.id,
            version_tag="v2026.1.0",
            published_date=date(2026, 2, 1),
            is_active=True,
        )
        db.add(eu_v1)
        await db.flush()

        eu_clause_text = (
            "High-risk AI systems shall be designed and developed in such a way that natural persons "
            "to whom human oversight is assigned are enabled to remain aware of the possible tendency "
            "of automatically relying on the output (automation bias) and possess an active runtime "
            "intervention capability (kill-switch) with an override latency not to exceed 500 milliseconds."
        )
        eu_clause = RegulationClause(
            id=uuid.uuid4(),
            version_id=eu_v1.id,
            clause_identifier="Article 14(4)(a)",
            clause_title="Human Oversight & Override Latency",
            clause_text=eu_clause_text,
            content_hash=calculate_sha256(eu_clause_text),
        )
        db.add(eu_clause)
        await db.flush()

        eu_assertion1 = RuleAssertion(
            id=uuid.uuid4(),
            regulation_clause_id=eu_clause.id,
            parameter_key="human_override_capability",
            operator="==",
            expected_value="true",
            error_message="High-risk AI system lacks mandatory human override capability under EU AI Act Art 14(4)(a).",
        )
        eu_assertion2 = RuleAssertion(
            id=uuid.uuid4(),
            regulation_clause_id=eu_clause.id,
            parameter_key="max_override_latency_ms",
            operator="<=",
            expected_value="500",
            error_message="Human override latency exceeds maximum allowable threshold of 500ms under EU AI Act Art 14(4)(a).",
        )
        db.add_all([eu_assertion1, eu_assertion2])

        print("Seeding Regulation 3: NYDFS Part 500...")
        nydfs = Regulation(
            id=uuid.uuid4(),
            code="NYDFS-500",
            title="Cybersecurity Requirements for Financial Services",
            jurisdiction="US_NYDFS",
        )
        db.add(nydfs)
        await db.flush()

        nydfs_v1 = RegulationVersion(
            id=uuid.uuid4(),
            regulation_id=nydfs.id,
            version_tag="v2026.1.0",
            published_date=date(2026, 1, 1),
            is_active=True,
        )
        db.add(nydfs_v1)
        await db.flush()

        nydfs_clause_text = "Covered entities shall securely maintain audit trails and access control logs for a mandatory minimum retention duration of three (3) years (1,095 calendar days)."
        nydfs_clause = RegulationClause(
            id=uuid.uuid4(),
            version_id=nydfs_v1.id,
            clause_identifier="23 NYCRR § 500.06",
            clause_title="Audit Trail Retention Ceiling",
            clause_text=nydfs_clause_text,
            content_hash=calculate_sha256(nydfs_clause_text),
        )
        db.add(nydfs_clause)
        await db.flush()

        nydfs_assertion = RuleAssertion(
            id=uuid.uuid4(),
            regulation_clause_id=nydfs_clause.id,
            parameter_key="min_audit_log_retention_days",
            operator=">=",
            expected_value="1095",
            error_message="Audit log retention fails mandatory 3-year (1,095 days) statutory minimum under 23 NYCRR § 500.06.",
        )
        db.add(nydfs_assertion)

        print("Seeding Regulation 4: EU GDPR...")
        gdpr = Regulation(
            id=uuid.uuid4(),
            code="GDPR-2016",
            title="General Data Protection Regulation",
            jurisdiction="EU_GDPR",
        )
        db.add(gdpr)
        await db.flush()

        gdpr_v1 = RegulationVersion(
            id=uuid.uuid4(),
            regulation_id=gdpr.id,
            version_tag="v2016.679",
            published_date=date(2016, 4, 27),
            is_active=True,
        )
        db.add(gdpr_v1)
        await db.flush()

        gdpr_clause_text = "In the case of a personal data breach, the controller shall without undue delay and, where feasible, not later than 72 hours after having become aware of it, notify the personal data breach to the supervisory authority."
        gdpr_clause = RegulationClause(
            id=uuid.uuid4(),
            version_id=gdpr_v1.id,
            clause_identifier="Article 33(1)",
            clause_title="Notification of a Personal Data Breach to the Supervisory Authority",
            clause_text=gdpr_clause_text,
            content_hash=calculate_sha256(gdpr_clause_text),
        )
        db.add(gdpr_clause)
        await db.flush()

        gdpr_assertion = RuleAssertion(
            id=uuid.uuid4(),
            regulation_clause_id=gdpr_clause.id,
            parameter_key="max_breach_notice_hours",
            operator="<=",
            expected_value="72",
            error_message="Breach notification timeline exceeds statutory 72-hour ceiling under GDPR Article 33(1).",
        )
        db.add(gdpr_assertion)

        print("Seeding Regulation 5: HIPAA Security Rule...")
        hipaa = Regulation(
            id=uuid.uuid4(),
            code="HIPAA-164",
            title="HIPAA Security & Breach Notification Rule",
            jurisdiction="US_HHS",
        )
        db.add(hipaa)
        await db.flush()

        hipaa_v1 = RegulationVersion(
            id=uuid.uuid4(),
            regulation_id=hipaa.id,
            version_tag="v2026.1.0",
            published_date=date(2026, 1, 1),
            is_active=True,
        )
        db.add(hipaa_v1)
        await db.flush()

        hipaa_clause_text = "Covered entities must implement a mechanism to encrypt and decrypt electronic protected health information (ePHI) in rest and transit, and disclose breaches within sixty (60) days."
        hipaa_clause = RegulationClause(
            id=uuid.uuid4(),
            version_id=hipaa_v1.id,
            clause_identifier="45 CFR § 164.312",
            clause_title="Technical Safeguards & ePHI Encryption",
            clause_text=hipaa_clause_text,
            content_hash=calculate_sha256(hipaa_clause_text),
        )
        db.add(hipaa_clause)
        await db.flush()

        hipaa_assertion1 = RuleAssertion(
            id=uuid.uuid4(),
            regulation_clause_id=hipaa_clause.id,
            parameter_key="ephi_encryption_enforced",
            operator="==",
            expected_value="true",
            error_message="Electronic Protected Health Information (ePHI) lacks mandatory encryption under 45 CFR § 164.312.",
        )
        hipaa_assertion2 = RuleAssertion(
            id=uuid.uuid4(),
            regulation_clause_id=hipaa_clause.id,
            parameter_key="max_breach_notice_days",
            operator="<=",
            expected_value="60",
            error_message="Breach notification window exceeds 60 calendar days under 45 CFR § 164.404.",
        )
        db.add_all([hipaa_assertion1, hipaa_assertion2])

        print("Seeding Regulation 6: CCPA / CPRA...")
        ccpa = Regulation(
            id=uuid.uuid4(),
            code="CCPA-1798",
            title="California Consumer Privacy Act (CCPA/CPRA)",
            jurisdiction="US_CALIFORNIA",
        )
        db.add(ccpa)
        await db.flush()

        ccpa_v1 = RegulationVersion(
            id=uuid.uuid4(),
            regulation_id=ccpa.id,
            version_tag="v2026.1.0",
            published_date=date(2026, 1, 1),
            is_active=True,
        )
        db.add(ccpa_v1)
        await db.flush()

        ccpa_clause_text = "Businesses shall disclose and deliver the required information to a consumer within 45 days of receiving a verifiable consumer request."
        ccpa_clause = RegulationClause(
            id=uuid.uuid4(),
            version_id=ccpa_v1.id,
            clause_identifier="Cal. Civ. Code § 1798.130",
            clause_title="Consumer Verification & Disclosure SLA",
            clause_text=ccpa_clause_text,
            content_hash=calculate_sha256(ccpa_clause_text),
        )
        db.add(ccpa_clause)
        await db.flush()

        ccpa_assertion = RuleAssertion(
            id=uuid.uuid4(),
            regulation_clause_id=ccpa_clause.id,
            parameter_key="max_consumer_request_days",
            operator="<=",
            expected_value="45",
            error_message="Consumer rights request SLA exceeds 45-day statutory cap under Cal. Civ. Code § 1798.130.",
        )
        db.add(ccpa_assertion)

        print("Seeding Policy 1: Core Banking Data Lifecycle SOP...")
        pol1 = EnterprisePolicy(
            id=uuid.uuid4(),
            title="Core Banking Data Lifecycle SOP",
            category="Data Governance",
            current_status="COMPLIANT",
        )
        db.add(pol1)
        await db.flush()

        pol1_clause_text = (
            "All authorized consumer financial records, transactional histories, and authentication "
            "query logs shall be retained in active data stores for a period of ninety (90) days "
            "following user session invalidation to facilitate customer support reconciliation."
        )
        pol1_clause = PolicyClause(
            id=uuid.uuid4(),
            policy_id=pol1.id,
            section_label="Section 4.2 - Token Retention Lifecycle",
            body_text=pol1_clause_text,
            content_hash=calculate_sha256(pol1_clause_text),
        )
        db.add(pol1_clause)
        await db.flush()

        dep1 = PolicyDependency(
            id=uuid.uuid4(),
            policy_clause_id=pol1_clause.id,
            regulation_clause_id=cfpb_clause.id,
            confidence_score=0.9850,
            is_verified=True,
        )
        db.add(dep1)

        print("Seeding Policy 2: Autonomous Credit Scoring Charter...")
        pol2 = EnterprisePolicy(
            id=uuid.uuid4(),
            title="Autonomous Credit Scoring Engine Governance Charter",
            category="AI Governance",
            current_status="CRITICAL_BREAK",
        )
        db.add(pol2)
        await db.flush()

        pol2_clause_text = (
            "The automated credit decision scoring service operates autonomously. System-level manual "
            "overrides are reviewed asynchronously via administrative ticket queues within two (2) business hours."
        )
        pol2_clause = PolicyClause(
            id=uuid.uuid4(),
            policy_id=pol2.id,
            section_label="Section 3.1 - Manual Intervention SLA",
            body_text=pol2_clause_text,
            content_hash=calculate_sha256(pol2_clause_text),
        )
        db.add(pol2_clause)
        await db.flush()

        dep2 = PolicyDependency(
            id=uuid.uuid4(),
            policy_clause_id=pol2_clause.id,
            regulation_clause_id=eu_clause.id,
            confidence_score=0.9420,
            is_verified=True,
        )
        db.add(dep2)

        await db.commit()

        # Seed Genesis Block in Audit Ledger
        print("Recording Genesis Block in SHA-256 Audit Ledger...")
        await record_audit_event(
            db=db,
            event_type="SYSTEM_INITIALIZATION",
            actor="system.genesis",
            payload={
                "message": "RegDiff compliance ledger initialized with baseline regulatory corpora",
                "frameworks": ["CFPB-1033", "EU-AI-ACT"],
                "seed_timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )

        print("Database seed completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
