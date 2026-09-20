from typing import List, Optional, Any, Dict
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

# Regulation schemas
class ClauseInput(BaseModel):
    clause_identifier: str = Field(..., description="e.g. 1033.351(a)(1)")
    clause_title: Optional[str] = None
    clause_text: str

class RegulationAmendRequest(BaseModel):
    version_tag: str = Field(..., description="e.g. 2026.3.0-REV")
    published_date: date
    clauses: List[ClauseInput]

class ClauseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    clause_identifier: str
    clause_title: Optional[str]
    clause_text: str
    content_hash: str
    created_at: datetime

class RegulationVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    regulation_id: UUID
    version_tag: str
    published_date: date
    is_active: bool
    clauses: List[ClauseResponse] = []

class RegulationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    code: str
    title: str
    jurisdiction: str
    versions: List[RegulationVersionResponse] = []

# Policy schemas
class PolicyClauseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    policy_id: UUID
    section_label: str
    body_text: str
    content_hash: str

class PolicyDependencyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    policy_clause_id: UUID
    regulation_clause_id: UUID
    confidence_score: float
    is_verified: bool

class EnterprisePolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    title: str
    organization: Optional[str] = "Apex Financial Technologies"
    filename: Optional[str] = None
    file_type: Optional[str] = "PDF"
    content_hash: Optional[str] = None
    category: str
    current_status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    clauses: List[PolicyClauseResponse] = []

# Run & Patch schemas
class RunExecuteRequest(BaseModel):
    regulation_version_id: UUID

class PatchApplyRequest(BaseModel):
    status: str = Field(default="APPLIED", description="APPLIED or REJECTED")
    reviewer_notes: Optional[str] = None

class PolicyPatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    run_id: UUID
    policy_clause_id: UUID
    original_text: str
    proposed_patch: str
    diff_unified: str
    rationale: str
    confidence_score: float
    status: str

class RegressionRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    trigger_regulation_version_id: Optional[UUID]
    status: str
    summary_report: Optional[Dict[str, Any]]
    executed_at: datetime
    patches: List[PolicyPatchResponse] = []

# Audit schemas
class AuditLedgerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    index: int
    timestamp: datetime
    event_type: str
    actor: str
    payload: Dict[str, Any]
    previous_hash: str
    current_hash: str

class LedgerVerifyResponse(BaseModel):
    is_valid: bool
    total_blocks: int
    error_reason: Optional[str] = None

# MCP schemas
class MCPCheckComplianceParams(BaseModel):
    retention_period_days: Optional[int] = None
    training_data_provenance: Optional[str] = None
    human_oversight_mechanism: Optional[str] = None
    human_override_capability: Optional[bool] = None
    override_latency_ms: Optional[int] = None

class MCPCheckComplianceRequest(BaseModel):
    action_type: str = Field(..., description="DATA_STORAGE, MODEL_INFERENCE, THIRD_PARTY_TRANSFER, TOKEN_REFRESH")
    target_jurisdiction: str = Field(..., description="US_CFPB, EU_ACT, US_FED")
    parameters: MCPCheckComplianceParams
