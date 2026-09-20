from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.schemas import MCPCheckComplianceRequest
from backend.app.mcp.compliance_checker import evaluate_mcp_compliance

router = APIRouter(prefix="/mcp", tags=["MCP Agent Interface"])

@router.post("/check_compliance")
async def check_compliance_endpoint(
    payload: MCPCheckComplianceRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    HTTP REST endpoint exposing the Model Context Protocol (MCP) check_compliance tool.
    Used by external agents and sandbox UI to evaluate statutory compliance.
    """
    result = await evaluate_mcp_compliance(
        db=db,
        action_type=payload.action_type,
        target_jurisdiction=payload.target_jurisdiction,
        parameters=payload.parameters.model_dump(exclude_none=True),
        actor="mcp.http_gateway"
    )
    return result
