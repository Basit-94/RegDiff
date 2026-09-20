from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import hashlib

router = APIRouter(prefix="/connectors", tags=["Enterprise Connectors"])

class ConnectorStatus(BaseModel):
    id: str
    name: str
    category: str  # CLM, CLOUD_STORAGE, TICKETING, COMMUNICATION
    icon: str
    status: str    # CONNECTED, DISCONNECTED, SYNCING, ERROR
    last_sync: Optional[str] = None
    documents_synced: int = 0
    auto_sync_enabled: bool = True
    webhook_url: Optional[str] = None
    auth_account: Optional[str] = None

class ConnectorSyncRequest(BaseModel):
    connector_id: str
    folder_path: Optional[str] = "/Legal/Active-Contracts"

class ConnectorSyncResponse(BaseModel):
    success: bool
    connector_id: str
    documents_scanned: int
    new_violations_detected: int
    sync_timestamp: str
    synced_items: List[Dict[str, Any]]
    merkle_batch_hash: str

class RemediationTicketRequest(BaseModel):
    statute: str
    policy_title: str
    violation_details: str
    priority: str = "P1-CRITICAL"
    assignee_email: str = "alex.vance@regdiff.internal"
    system_target: str = "Jira" # Jira, ServiceNow, Slack

class RemediationTicketResponse(BaseModel):
    ticket_id: str
    system: str
    ticket_url: str
    status: str
    created_at: str
    summary: str
    priority: str

# In-memory mock store for enterprise connectors
CONNECTORS_DB: Dict[str, Dict[str, Any]] = {
    "docusign": {
        "id": "docusign",
        "name": "DocuSign / Ironclad CLM",
        "category": "CLM",
        "icon": "signature",
        "status": "CONNECTED",
        "last_sync": "2026-09-20T08:30:00Z",
        "documents_synced": 42,
        "auto_sync_enabled": True,
        "webhook_url": "https://api.regdiff.internal/v1/webhooks/docusign-envelope-completed",
        "auth_account": "corp-legal@apexfintech.com"
    },
    "sharepoint": {
        "id": "sharepoint",
        "name": "Microsoft SharePoint & OneDrive",
        "category": "CLOUD_STORAGE",
        "icon": "cloud_done",
        "status": "CONNECTED",
        "last_sync": "2026-09-20T10:15:00Z",
        "documents_synced": 128,
        "auto_sync_enabled": True,
        "webhook_url": "https://api.regdiff.internal/v1/webhooks/msft-graph-delta",
        "auth_account": "compliance-sharepoint@apexfintech.com"
    },
    "gdrive": {
        "id": "gdrive",
        "name": "Google Workspace Drive",
        "category": "CLOUD_STORAGE",
        "icon": "folder_shared",
        "status": "CONNECTED",
        "last_sync": "2026-09-20T11:00:00Z",
        "documents_synced": 89,
        "auto_sync_enabled": True,
        "webhook_url": "https://api.regdiff.internal/v1/webhooks/gdrive-push",
        "auth_account": "legal-vault@apexfintech.com"
    },
    "jira": {
        "id": "jira",
        "name": "Jira Software & Service Desk",
        "category": "TICKETING",
        "icon": "task_alt",
        "status": "CONNECTED",
        "last_sync": "2026-09-20T12:00:00Z",
        "documents_synced": 0,
        "auto_sync_enabled": True,
        "webhook_url": "https://jira.apexfintech.atlassian.net/rest/api/3/issue",
        "auth_account": "secops-jira-bot@apexfintech.com"
    },
    "servicenow": {
        "id": "servicenow",
        "name": "ServiceNow GRC",
        "category": "TICKETING",
        "icon": "developer_board",
        "status": "CONNECTED",
        "last_sync": "2026-09-20T09:45:00Z",
        "documents_synced": 0,
        "auto_sync_enabled": True,
        "webhook_url": "https://apexfintech.service-now.com/api/now/table/sn_grc_issue",
        "auth_account": "servicenow-grc-connector@apexfintech.com"
    },
    "slack": {
        "id": "slack",
        "name": "Slack Enterprise Grid",
        "category": "COMMUNICATION",
        "icon": "forum",
        "status": "CONNECTED",
        "last_sync": "2026-09-20T12:30:00Z",
        "documents_synced": 0,
        "auto_sync_enabled": True,
        "webhook_url": "https://hooks.slack.com/services/T00/B00/RegDiffAlerts",
        "auth_account": "#legal-compliance-ops"
    }
}

@router.get("/list", response_model=List[ConnectorStatus])
async def list_connectors():
    """List all enterprise connectors and their current real-time synchronization state."""
    return list(CONNECTORS_DB.values())

@router.post("/toggle/{connector_id}")
async def toggle_connector(connector_id: str):
    """Toggle a connector between CONNECTED and DISCONNECTED."""
    if connector_id not in CONNECTORS_DB:
        raise HTTPException(status_code=404, detail="Connector not found")
    current = CONNECTORS_DB[connector_id]["status"]
    CONNECTORS_DB[connector_id]["status"] = "DISCONNECTED" if current == "CONNECTED" else "CONNECTED"
    return CONNECTORS_DB[connector_id]

@router.post("/sync", response_model=ConnectorSyncResponse)
async def trigger_sync(req: ConnectorSyncRequest):
    """Trigger an on-demand synchronization scan of connected cloud drives or CLM pipelines."""
    if req.connector_id not in CONNECTORS_DB:
        raise HTTPException(status_code=404, detail="Connector not found")
    
    conn = CONNECTORS_DB[req.connector_id]
    now_iso = datetime.utcnow().isoformat() + "Z"
    conn["last_sync"] = now_iso
    conn["documents_synced"] = conn.get("documents_synced", 0) + 3

    sample_items = [
        {"title": "Vendor Master Services Agreement (CloudScale LLC).docx", "status": "FLAGGED", "statute": "CFPB Rule 1033", "path": f"{req.folder_path}/Vendor_MSA_CloudScale.docx"},
        {"title": "AI Copilot Hiring Assessment Protocol.pdf", "status": "FLAGGED", "statute": "EU AI Act Art. 14", "path": f"{req.folder_path}/HR_AI_Protocol_2026.pdf"},
        {"title": "Customer Data Retention & Destruction SOP.docx", "status": "COMPLIANT", "statute": "NYDFS Part 500", "path": f"{req.folder_path}/SOP_Data_Retention.docx"}
    ]

    batch_hash = "0x" + hashlib.sha256(f"{req.connector_id}-{now_iso}".encode()).hexdigest()

    return ConnectorSyncResponse(
        success=True,
        connector_id=req.connector_id,
        documents_scanned=3,
        new_violations_detected=2,
        sync_timestamp=now_iso,
        synced_items=sample_items,
        merkle_batch_hash=batch_hash
    )

@router.post("/dispatch_ticket", response_model=RemediationTicketResponse)
async def dispatch_remediation_ticket(req: RemediationTicketRequest):
    """Dispatch automated high-priority Jira or ServiceNow remediation tickets when a statute changes."""
    ticket_num = 4000 + (hash(req.policy_title + req.statute) % 900)
    now_iso = datetime.utcnow().isoformat() + "Z"

    if req.system_target.lower() == "servicenow":
        ticket_id = f"SN-INC00{ticket_num}"
        ticket_url = f"https://apexfintech.service-now.com/nav_to.do?uri=incident.do?sys_id={ticket_num}"
    elif req.system_target.lower() == "slack":
        ticket_id = f"SLACK-MSG-{ticket_num}"
        ticket_url = f"https://apexfintech.slack.com/archives/C081LEGAL/p{ticket_num}"
    else:
        ticket_id = f"COMP-{ticket_num}"
        ticket_url = f"https://jira.apexfintech.atlassian.net/browse/COMP-{ticket_num}"

    return RemediationTicketResponse(
        ticket_id=ticket_id,
        system=req.system_target,
        ticket_url=ticket_url,
        status="OPEN (ASSIGNED)",
        created_at=now_iso,
        summary=f"[{req.priority}] Automated Statutory Remediation: {req.policy_title} violates {req.statute}",
        priority=req.priority
    )
