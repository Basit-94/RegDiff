import uuid
from datetime import datetime, date
from typing import List, Optional
from sqlalchemy import (
    Column,
    String,
    Text,
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    BigInteger,
    JSON,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.types import TypeDecorator, CHAR

Base = declarative_base()

class GUID(TypeDecorator):
    """Platform-independent GUID/UUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(36).
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == "postgresql":
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return str(uuid.UUID(str(value)))
            else:
                return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(str(value))
            return value


class User(Base):
    __tablename__ = "users"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String(128), unique=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    full_name = Column(String(128), nullable=False)
    role = Column(String(64), default="LEAD COUNSEL")
    organization = Column(String(128), default="RegDiff Enclave")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class Regulation(Base):
    __tablename__ = "regulations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    code = Column(String(64), nullable=False, unique=True)
    title = Column(Text, nullable=False)
    jurisdiction = Column(String(32), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    versions = relationship("RegulationVersion", back_populates="regulation", cascade="all, delete-orphan")


class RegulationVersion(Base):
    __tablename__ = "regulation_versions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    regulation_id = Column(GUID(), ForeignKey("regulations.id", ondelete="CASCADE"), nullable=False)
    version_tag = Column(String(32), nullable=False)
    published_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("regulation_id", "version_tag", name="uq_regulation_version_tag"),
    )

    regulation = relationship("Regulation", back_populates="versions")
    clauses = relationship("RegulationClause", back_populates="version", cascade="all, delete-orphan")
    runs = relationship("RegressionRun", back_populates="regulation_version")


class RegulationClause(Base):
    __tablename__ = "regulation_clauses"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    version_id = Column(GUID(), ForeignKey("regulation_versions.id", ondelete="CASCADE"), nullable=False)
    clause_identifier = Column(String(64), nullable=False)
    clause_title = Column(Text, nullable=True)
    clause_text = Column(Text, nullable=False)
    content_hash = Column(String(64), nullable=False)
    embedding = Column(JSON, nullable=True)  # vector representation in JSON or pgvector
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    version = relationship("RegulationVersion", back_populates="clauses")
    dependencies = relationship("PolicyDependency", back_populates="regulation_clause", cascade="all, delete-orphan")
    assertions = relationship("RuleAssertion", back_populates="regulation_clause", cascade="all, delete-orphan")


class EnterprisePolicy(Base):
    __tablename__ = "enterprise_policies"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    organization = Column(String(128), nullable=True, default="Apex Financial Technologies")
    filename = Column(String(256), nullable=True)
    file_type = Column(String(32), nullable=True, default="PDF")
    content_hash = Column(String(64), nullable=True)
    category = Column(String(64), nullable=False)
    current_status = Column(String(32), default="COMPLIANT")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    clauses = relationship("PolicyClause", back_populates="policy", cascade="all, delete-orphan")


class PolicyClause(Base):
    __tablename__ = "policy_clauses"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    policy_id = Column(GUID(), ForeignKey("enterprise_policies.id", ondelete="CASCADE"), nullable=False)
    section_label = Column(String(64), nullable=False)
    body_text = Column(Text, nullable=False)
    content_hash = Column(String(64), nullable=False)
    embedding = Column(JSON, nullable=True)

    policy = relationship("EnterprisePolicy", back_populates="clauses")
    dependencies = relationship("PolicyDependency", back_populates="policy_clause", cascade="all, delete-orphan")
    patches = relationship("PolicyPatch", back_populates="policy_clause", cascade="all, delete-orphan")


class PolicyDependency(Base):
    __tablename__ = "policy_dependencies"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    policy_clause_id = Column(GUID(), ForeignKey("policy_clauses.id", ondelete="CASCADE"), nullable=False)
    regulation_clause_id = Column(GUID(), ForeignKey("regulation_clauses.id", ondelete="CASCADE"), nullable=False)
    confidence_score = Column(Float, nullable=False)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("policy_clause_id", "regulation_clause_id", name="uq_policy_reg_dependency"),
    )

    policy_clause = relationship("PolicyClause", back_populates="dependencies")
    regulation_clause = relationship("RegulationClause", back_populates="dependencies")


class RuleAssertion(Base):
    __tablename__ = "rule_assertions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    regulation_clause_id = Column(GUID(), ForeignKey("regulation_clauses.id", ondelete="CASCADE"), nullable=False)
    parameter_key = Column(String(64), nullable=False)
    operator = Column(String(8), nullable=False)  # <=, >=, ==, !=, <, >
    expected_value = Column(String(64), nullable=False)
    error_message = Column(Text, nullable=False)

    regulation_clause = relationship("RegulationClause", back_populates="assertions")


class RegressionRun(Base):
    __tablename__ = "regression_runs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    trigger_regulation_version_id = Column(GUID(), ForeignKey("regulation_versions.id"), nullable=True)
    status = Column(String(32), nullable=False)  # PASSED, CRITICAL_BREAK, IN_PROGRESS, FAILED
    summary_report = Column(JSON, nullable=True)
    executed_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    regulation_version = relationship("RegulationVersion", back_populates="runs")
    patches = relationship("PolicyPatch", back_populates="regression_run", cascade="all, delete-orphan")


class PolicyPatch(Base):
    __tablename__ = "policy_patches"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    run_id = Column(GUID(), ForeignKey("regression_runs.id", ondelete="CASCADE"), nullable=False)
    policy_clause_id = Column(GUID(), ForeignKey("policy_clauses.id", ondelete="CASCADE"), nullable=False)
    original_text = Column(Text, nullable=False)
    proposed_patch = Column(Text, nullable=False)
    diff_unified = Column(Text, nullable=False)
    rationale = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=False)
    status = Column(String(32), default="PROPOSED")  # PROPOSED, APPLIED, REJECTED

    regression_run = relationship("RegressionRun", back_populates="patches")
    policy_clause = relationship("PolicyClause", back_populates="patches")


class AuditLedger(Base):
    __tablename__ = "audit_ledger"

    index = Column(BigInteger, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)
    event_type = Column(String(64), nullable=False)
    actor = Column(String(128), nullable=False)
    payload = Column(JSON, nullable=False)
    previous_hash = Column(String(64), nullable=False)
    current_hash = Column(String(64), nullable=False)
