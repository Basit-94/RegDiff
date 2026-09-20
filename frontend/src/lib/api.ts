export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://regdiff-backend.onrender.com'
    : 'http://127.0.0.1:8000');

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  mode: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization: string;
  token: string;
}

export interface Regulation {
  id: string;
  code: string;
  title: string;
  jurisdiction: string;
  versions?: Array<{
    id: string;
    version_tag: string;
    published_date: string;
    is_active: boolean;
    clauses?: Array<{
      id: string;
      clause_identifier: string;
      clause_title: string;
      clause_text: string;
      content_hash: string;
    }>;
  }>;
}

export interface Policy {
  id: string;
  title: string;
  organization?: string;
  filename?: string;
  file_type?: string;
  content_hash?: string;
  category: string;
  current_status: string;
  created_at?: string;
  updated_at?: string;
  clauses: Array<{
    id: string;
    policy_id: string;
    section_label: string;
    body_text: string;
    content_hash: string;
  }>;
}

export interface LedgerVerification {
  is_valid: boolean;
  total_blocks: number;
  error_reason?: string | null;
}

export interface AuditBlock {
  index: number;
  timestamp: string;
  event_type: string;
  actor: string;
  payload: Record<string, unknown>;
  previous_hash: string;
  current_hash: string;
}

export interface MCPViolation {
  clause: string;
  parameter: string;
  observed: unknown;
  statutory_limit: string;
  error: string;
}

export interface MCPComplianceResult {
  compliant: boolean;
  status: 'APPROVED' | 'REJECTED';
  jurisdiction: string;
  framework: string;
  version_tag: string;
  violations: MCPViolation[];
  audit_block_index: number;
  audit_hash: string;
  message: string;
}

export interface ExtractedSection {
  page: number;
  organization: string;
  title: string;
  framework_id: string;
  citation: string;
  section_label: string;
  key_clause: string;
  remediated: string;
  full_text: string;
}

export interface ExtractedDocumentResponse {
  filename: string;
  total_pages: number;
  file_size: number;
  sections: ExtractedSection[];
}

export interface AnalyzeTextResponse {
  valid: boolean;
  compliant: boolean;
  status: 'APPROVED' | 'REJECTED';
  framework_id: string;
  citation: string;
  violations: MCPViolation[];
  original_text: string;
  remediated_text: string;
  extracted_parameters: Record<string, unknown>;
  audit_hash?: string;
  audit_block_index?: number;
  organization?: string;
  doc_title?: string;
  section_label?: string;
}

export interface SentinelWatch {
  code: string;
  title: string;
  citation: string;
  jurisdiction: string;
  monitored_parameter: string;
  status: string;
  enforcement_date: string;
  severity: string;
}

export interface SentinelStatus {
  sentinel_active: boolean;
  vault_summary: {
    total_documents: number;
    compliant: number;
    breached: number;
  };
  ledger_block_height: number;
  monitored_regulations: SentinelWatch[];
}

// 1. Health Check
export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

// 2. Auth API
export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Invalid login credentials');
  }
  return res.json();
}

export async function registerUser(payload: {
  email: string;
  password: string;
  full_name: string;
  organization?: string;
  role?: string;
}): Promise<AuthUser> {
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Registration failed');
  }
  return res.json();
}

export async function demoLogin(): Promise<AuthUser> {
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/demo_login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error('Demo login failed');
  return res.json();
}

// 3. Vault & Policy Management
export async function checkCompliance(
  actionType: string,
  targetJurisdiction: string,
  params: {
    retention_period_days?: number;
    human_override_capability?: boolean;
    override_latency_ms?: number;
  }
): Promise<MCPComplianceResult> {
  const res = await fetch(`${BACKEND_URL}/api/v1/mcp/check_compliance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action_type: actionType,
      target_jurisdiction: targetJurisdiction,
      parameters: params,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail?.detail || 'Compliance check failed');
  }
  return res.json();
}

export async function fetchVaultPolicies(): Promise<Policy[]> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error('Failed to fetch policies');
  return res.json();
}

export async function savePolicyToVault(payload: {
  title: string;
  organization?: string;
  filename?: string;
  file_type?: string;
  category?: string;
  current_status?: string;
  section_label?: string;
  body_text: string;
}): Promise<Policy> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/vault_save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to save policy to Vault');
  }
  return res.json();
}

export async function deleteVaultPolicy(policyId: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/${policyId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete policy from Vault');
}

export async function clearVaultPolicies(): Promise<{ cleared: boolean; deleted_count: number }> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/clear_vault`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to clear vault');
  return res.json();
}

export async function loadSampleSuite(): Promise<{ success: boolean; count: number; message: string }> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/load_sample_suite`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to load sample suite');
  return res.json();
}

// 4. Ingestion & Analysis
export async function uploadAndExtractDocument(file: File): Promise<ExtractedDocumentResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/extract_pdf`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to extract document');
  }
  return res.json();
}

export async function analyzePolicyText(payload: {
  text: string;
  framework_id?: string;
  organization?: string;
  doc_title?: string;
  section_label?: string;
}): Promise<AnalyzeTextResponse> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/analyze_text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 422) {
      throw new Error(err.detail?.message || 'Input does not contain enforceable legal clauses.');
    }
    throw new Error(err.detail || 'Failed to analyze text');
  }
  return res.json();
}

// 5. Sentinel & Simulation API
export async function fetchSentinelStatus(): Promise<SentinelStatus> {
  const res = await fetch(`${BACKEND_URL}/api/v1/sentinel/status`, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error('Failed to fetch sentinel status');
  return res.json();
}

export async function simulateRegulatoryShift(): Promise<Record<string, unknown>> {
  const res = await fetch(`${BACKEND_URL}/api/v1/sentinel/simulate_shift`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ simulation_type: 'CFPB_30_DAY_REDUCTION' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Simulation failed');
  }
  return res.json();
}

// 6. Ledger & Proof
export async function verifyLedgerChain(): Promise<LedgerVerification> {
  const res = await fetch(`${BACKEND_URL}/api/v1/ledger/verify`, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error('Ledger verification failed');
  return res.json();
}

export async function fetchAuditBlocks(limit = 20): Promise<AuditBlock[]> {
  const res = await fetch(`${BACKEND_URL}/api/v1/ledger?limit=${limit}`, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error('Failed to fetch ledger blocks');
  return res.json();
}

// 7. Word (.docx) Redline Export
export async function downloadRedlineDocx(payload: {
  title: string;
  original_text: string;
  remediated_text: string;
  citation: string;
  organization?: string;
  section_label?: string;
  audit_block_index?: number;
  audit_hash?: string;
  plain_english_reason?: string;
  is_compliant?: boolean;
}): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/export_docx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to export DOCX redline');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanTitle = (payload.title || 'Policy').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `${cleanTitle}_Redline_TrackChanges.docx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function downloadVaultDocx(policyId: string, title?: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/${policyId}/export_docx`);
  if (!res.ok) throw new Error('Failed to download vault DOCX');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanTitle = (title || 'Vault_Policy').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `${cleanTitle}_Vault_Redline.docx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// 8. Live Federal Register Feed
export interface LiveRegulatoryItem {
  document_number: string;
  title: string;
  agency: string;
  publication_date: string;
  action: string;
  citation: string;
  html_url: string;
  abstract: string;
  status: string;
  impact_risk: string;
  live_source?: boolean;
}

export interface LiveFeedResponse {
  source: string;
  live_connected: boolean;
  timestamp: string;
  total_items: number;
  items: LiveRegulatoryItem[];
}

export async function fetchLiveRegulatoryFeed(): Promise<LiveFeedResponse> {
  const res = await fetch(`${BACKEND_URL}/api/v1/sentinel/live-feed`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error('Failed to fetch live regulatory feed');
  return res.json();
}

// 9. CI/CD Pull Request Compliance Check
export interface CICDCheckResponse {
  status: 'PASSED' | 'BLOCKED';
  exit_code: number;
  is_compliant: boolean;
  repository: string;
  branch: string;
  commit_sha: string;
  pr_number: number;
  file_path: string;
  citation: string;
  remediated_text: string;
  audit_block_index: number;
  audit_hash: string;
  github_markdown_comment: string;
}

export async function runCICDCheck(payload: {
  repository?: string;
  branch?: string;
  commit_sha?: string;
  pr_number?: number;
  file_path?: string;
  policy_text: string;
  framework_id?: string;
}): Promise<CICDCheckResponse> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/cicd_check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('CI/CD compliance check failed');
  return res.json();
}

// 10. Audit Certificate Export
export async function fetchAuditCertificate(blockIndex: number): Promise<Record<string, unknown>> {
  const res = await fetch(`${BACKEND_URL}/api/v1/ledger/certificate/${blockIndex}`);
  if (!res.ok) throw new Error('Failed to fetch audit certificate');
  return res.json();
}

// 11. Multi-Statute Cross-Audit (Omni-Scan)
export interface OmniStatuteResult {
  framework_id: string;
  name: string;
  citation: string;
  statutory_rule: string;
  penalty_exposure: string;
  compliant: boolean;
  status: 'APPROVED' | 'REJECTED';
  violations: MCPViolation[];
  remediated_text: string;
}

export interface OmniAuditResponse {
  overall_score: number;
  compliant_count: number;
  total_statutes: number;
  breached_statutes_count?: number;
  breached_framework_ids?: string[];
  omni_remediated_text?: string;
  audit_block_index: number;
  audit_hash: string;
  matrix: OmniStatuteResult[];
}

export async function runOmniAudit(payload: {
  text: string;
  organization?: string;
  doc_title?: string;
  section_label?: string;
}): Promise<OmniAuditResponse> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/omni_audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail?.message || 'Omni-statutory audit failed');
  }
  return res.json();
}

// 12. Autonomous Regulatory Webhooks (Slack / Teams / PagerDuty)
export interface WebhookChannel {
  id: string;
  name: string;
  webhook_url: string;
  platform: string;
  enabled: boolean;
  event_triggers: string[];
  created_at: string;
  last_dispatch_status: string;
  last_dispatched_at?: string | null;
}

export async function fetchWebhooks(): Promise<{ total_webhooks: number; webhooks: WebhookChannel[] }> {
  const res = await fetch(`${BACKEND_URL}/api/v1/sentinel/webhooks`);
  if (!res.ok) throw new Error('Failed to fetch webhooks');
  return res.json();
}

export async function addWebhook(payload: {
  name: string;
  webhook_url: string;
  platform?: string;
  enabled?: boolean;
  event_triggers?: string[];
}): Promise<{ success: boolean; webhook: WebhookChannel }> {
  const res = await fetch(`${BACKEND_URL}/api/v1/sentinel/webhooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to add webhook');
  return res.json();
}

export async function testWebhookDispatch(webhookId?: string, alertStatute?: string): Promise<Record<string, unknown>> {
  const url = `${BACKEND_URL}/api/v1/sentinel/test_webhook?webhook_id=${webhookId || 'wh-default-slack'}&alert_statute=${encodeURIComponent(alertStatute || '12 CFR § 1033.351 (CFPB Rule 1033)')}`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to dispatch test webhook');
  return res.json();
}

// 13. Comprehensive Multi-Clause Full-Document Audit & Redline
export interface FullDocumentClause {
  clause_id: string;
  section_label: string;
  page: number;
  original_text: string;
  framework_id: string;
  citation: string;
  compliant: boolean;
  violations: MCPViolation[];
  remediated_text: string;
  penalty_exposure: string;
  is_modified?: boolean;
  section_number?: string;
  title?: string;
}

export interface FullDocumentAuditResponse {
  document_title: string;
  organization: string;
  total_clauses: number;
  compliant_count: number;
  breach_count: number;
  overall_score: number;
  total_penalty_exposure_usd: string;
  audit_block_index: number;
  audit_hash: string;
  clauses: FullDocumentClause[];
  overall_status?: string;
  compliant_clauses?: number;
}

export async function auditFullDocument(payload: {
  clauses: Array<{
    clause_id?: string;
    section_label?: string;
    page?: number;
    original_text: string;
    framework_id?: string;
    citation?: string;
    remediated_text?: string;
  }>;
  organization?: string;
  doc_title?: string;
}): Promise<FullDocumentAuditResponse> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/audit_full_document`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Full document audit failed');
  }
  return res.json();
}

export async function downloadFullDocumentDocx(payload: {
  title: string;
  organization?: string;
  clauses: Array<any>;
  audit_block_index?: number;
  audit_hash?: string;
  overall_score?: number;
}): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/export_full_docx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to generate full Word document');

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  let filename = `${payload.title.replace(/\s+/g, '_')}_Full_Redline.docx`;
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) filename = match[1];
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function dispatchDirectWebhook(payload: {
  webhook_url: string;
  doc_title: string;
  organization?: string;
  overall_score: number;
  breach_count: number;
  audit_hash: string;
  clauses?: Array<any>;
}): Promise<{ success: boolean; message: string; status_code: number }> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/dispatch_webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to dispatch webhook');
  }
  return res.json();
}

export async function dispatchGitHubPullRequest(payload: {
  github_token: string;
  repo: string;
  branch_name?: string;
  file_path?: string;
  remediated_content: string;
  pr_title?: string;
  doc_title?: string;
}): Promise<{ success: boolean; pr_number?: number; pr_url?: string; branch?: string; message: string }> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/dispatch_github_pr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Failed to dispatch GitHub PR');
  }
  return data;
}

// 14. Multi-Model AI Statutory Consensus Engine
export interface ConsensusModelItem {
  model_name: string;
  role: string;
  verdict: string;
  status: string;
  confidence_score: number;
  reasoning: string;
  latency_ms: number;
}

export interface ConsensusAuditResponse {
  consensus_status: string;
  agreement_score: string;
  is_compliant: boolean;
  combined_confidence: number;
  framework_id: string;
  doc_title?: string;
  models: ConsensusModelItem[];
  audit_block_index: number;
  consensus_hash: string;
  timestamp: string;
}

export async function runConsensusAudit(payload: {
  policy_text: string;
  framework_id?: string;
  organization?: string;
  doc_title?: string;
  section_label?: string;
}): Promise<ConsensusAuditResponse> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/consensus_audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Consensus evaluation failed');
  }
  return res.json();
}

// 15. Enterprise Repository Connectors (Google Drive, Confluence, GitHub, Notion)
export interface ConnectorItem {
  id: string;
  name: string;
  folder_name: string;
  platform: string;
  icon: string;
  status: string;
  synced_documents_count: number;
  last_sync_timestamp: string;
  sync_frequency: string;
}

export async function fetchConnectors(): Promise<{ connectors: ConnectorItem[] }> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/connectors`);
  if (!res.ok) throw new Error('Failed to load enterprise connectors');
  return res.json();
}

export async function syncConnector(connectorId: string, organization?: string): Promise<{
  success: boolean;
  connector_id: string;
  message: string;
  synced_policies: Array<{ id: string; title: string; category: string; status: string }>;
  audit_block_index: number;
}> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/connectors/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ connector_id: connectorId, organization: organization || 'Apex Financial Technologies LLC' }),
  });
  if (!res.ok) throw new Error('Failed to synchronize connector');
  return res.json();
}

// 16. AI Safety, Bias Detection & Governance Auditor (Track 2 + Track 3 Synergy)
export interface AISafetyAuditResponse {
  risk_tier: string;
  risk_tier_label: string;
  governing_statutes: string[];
  human_override_compliant: boolean;
  human_override_observed: string;
  human_override_required: string;
  bias_audit_compliant: boolean;
  bias_impact_ratio: number;
  bias_threshold: number;
  training_data_compliant: boolean;
  training_data_observed: string;
  overall_safety_score: number;
  remediated_contract_text: string;
  audit_block_index: number;
  audit_hash: string;
}

export async function runAISafetyAudit(
  contractText: string,
  docTitle?: string,
  organization?: string
): Promise<AISafetyAuditResponse> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/ai_safety_audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contract_text: contractText,
      doc_title: docTitle || 'AI Model Deployment & Vendor Agreement',
      organization: organization || 'Apex Financial Technologies LLC',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'AI Safety audit failed');
  }
  return res.json();
}

export interface MascotChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface MascotChatResponse {
  reply: string;
  source: string;
  suggested_actions?: string[];
}

export async function sendMascotChat(payload: {
  message: string;
  history?: MascotChatMessage[];
  page_context?: string;
  doc_title?: string;
  framework_id?: string;
  active_clause?: string;
  api_key?: string;
}): Promise<MascotChatResponse> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/mascot_chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to chat with mascot');
  }
  return res.json();
}

// 17. Phase 1: Enterprise Ecosystem Connectors & Ticket Dispatch
export interface EnterpriseConnector {
  id: string;
  name: string;
  category: string;
  icon: string;
  status: string;
  last_sync?: string;
  documents_synced: number;
  auto_sync_enabled: boolean;
  webhook_url?: string;
  auth_account?: string;
}

export interface ConnectorSyncResult {
  success: boolean;
  connector_id: string;
  documents_scanned: number;
  new_violations_detected: number;
  sync_timestamp: string;
  synced_items: Array<{ title: string; status: string; statute: string; path: string }>;
  merkle_batch_hash: string;
}

export async function fetchEnterpriseConnectors(): Promise<EnterpriseConnector[]> {
  const res = await fetch(`${BACKEND_URL}/api/v1/connectors/list`);
  if (!res.ok) throw new Error('Failed to fetch connectors');
  return res.json();
}

export async function toggleEnterpriseConnector(connectorId: string): Promise<EnterpriseConnector> {
  const res = await fetch(`${BACKEND_URL}/api/v1/connectors/toggle/${connectorId}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to toggle connector');
  return res.json();
}

export async function syncEnterpriseConnector(connectorId: string, folderPath?: string): Promise<ConnectorSyncResult> {
  const res = await fetch(`${BACKEND_URL}/api/v1/connectors/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ connector_id: connectorId, folder_path: folderPath || '/Legal/Active-Contracts' }),
  });
  if (!res.ok) throw new Error('Failed to sync connector');
  return res.json();
}

export async function dispatchTicket(payload: {
  statute: string;
  policy_title: string;
  violation_details: string;
  priority?: string;
  assignee_email?: string;
  system_target: 'Jira' | 'ServiceNow' | 'Slack';
}): Promise<{
  ticket_id: string;
  system: string;
  ticket_url: string;
  status: string;
  created_at: string;
  summary: string;
  priority: string;
}> {
  const res = await fetch(`${BACKEND_URL}/api/v1/connectors/dispatch_ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to dispatch ticket');
  return res.json();
}

// 18. Phase 2: Custom Enterprise Policy Compiler
export interface CustomRuleItem {
  rule_id: string;
  rule_name: string;
  department: string;
  parameter_key: string;
  operator: string;
  expected_value: string;
  statute_reference?: string;
  rule_hash: string;
  created_at: string;
}

export async function fetchCustomRules(): Promise<CustomRuleItem[]> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/custom_rules`);
  if (!res.ok) throw new Error('Failed to fetch custom rules');
  return res.json();
}

export async function compileCustomRule(payload: {
  rule_name: string;
  department?: string;
  parameter_key: string;
  operator: string;
  expected_value: string;
  statute_reference?: string;
  test_clause?: string;
}): Promise<{
  success: boolean;
  rule_id: string;
  rule_hash: string;
  compiled_ast: Record<string, unknown>;
  evaluation_result?: {
    tested_text: string;
    extracted_parameters: Record<string, unknown>;
    compliant: boolean;
    message: string;
  };
  registered_at: string;
}> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/compile_custom_rule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to compile custom rule');
  return res.json();
}

// 19. Phase 3: Counterparty Word Redline Exchanger
export async function dispatchCounterpartyPack(payload: {
  counterparty_name: string;
  counsel_email: string;
  policy_title: string;
  citation: string;
  remediated_text: string;
  organization?: string;
  include_fre902_cert?: boolean;
}): Promise<{
  success: boolean;
  pack_id: string;
  certificate_id: string;
  counterparty: string;
  counsel_email: string;
  cover_letter: string;
  docx_download_url: string;
  dispatched_at: string;
  status: string;
}> {
  const res = await fetch(`${BACKEND_URL}/api/v1/policies/dispatch_counterparty_pack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to dispatch counterparty pack');
  return res.json();
}

// 20. Phase 4: Public Verification & InsurTech Scorecard
export interface PublicVerificationResponse {
  verified: boolean;
  query: string;
  certificate_id: string;
  block_index: number;
  timestamp: string;
  event_type: string;
  attesting_authority: string;
  actor: string;
  merkle_root: string;
  current_hash: string;
  status: string;
  evidentiary_standard: string;
  statutory_scope: string[];
}

export interface InsurtechScoreResponse {
  continuous_compliance_score: number;
  underwriting_tier: string;
  chain_tamper_evident: boolean;
  total_attestation_blocks: number;
  metrics: {
    statute_drift_latency_seconds: number;
    automated_redline_accuracy_pct: number;
    merkle_proof_integrity_pct: number;
    ci_cd_policy_gate_enforcement: string;
  };
  financial_impact: {
    projected_premium_discount_pct: number;
    estimated_annual_insurance_savings_usd: number;
    statutory_exposure_mitigated_usd: number;
    cfpb_daily_fine_prevention_usd: number;
  };
  underwriter_verification_url: string;
}

export async function verifyPublicCertificate(identifier: string): Promise<PublicVerificationResponse> {
  const res = await fetch(`${BACKEND_URL}/api/v1/ledger/public_verify/${encodeURIComponent(identifier)}`);
  if (!res.ok) throw new Error('Certificate or hash not found');
  return res.json();
}

export async function fetchInsurtechScore(): Promise<InsurtechScoreResponse> {
  const res = await fetch(`${BACKEND_URL}/api/v1/ledger/insurtech_score`);
  if (!res.ok) throw new Error('Failed to fetch InsurTech score');
  return res.json();
}





