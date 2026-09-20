import sys
import json
import asyncio
from backend.app.core.database import AsyncSessionLocal, init_db
from backend.app.mcp.compliance_checker import evaluate_mcp_compliance

TOOL_DEFINITION = {
    "name": "check_compliance",
    "description": "Validates an intended enterprise data operation or agent tool call against active statutory regulations.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "action_type": {
                "type": "string",
                "enum": ["DATA_STORAGE", "MODEL_INFERENCE", "THIRD_PARTY_TRANSFER", "TOKEN_REFRESH"],
                "description": "The category of operational data action being attempted."
            },
            "target_jurisdiction": {
                "type": "string",
                "enum": ["US_CFPB", "EU_ACT", "US_FED"],
                "description": "The legal jurisdiction governing the operation."
            },
            "parameters": {
                "type": "object",
                "properties": {
                    "retention_period_days": {
                        "type": "integer",
                        "description": "Intended duration for keeping consumer financial or session data."
                    },
                    "training_data_provenance": {
                        "type": "string",
                        "description": "Source and lineage audit trail for model inputs."
                    },
                    "human_oversight_mechanism": {
                        "type": "string",
                        "description": "Description of human-in-the-loop control (e.g. kill-switch)."
                    },
                    "override_latency_ms": {
                        "type": "integer",
                        "description": "Latency in milliseconds for human override execution."
                    }
                },
                "required": ["retention_period_days"]
            }
        },
        "required": ["action_type", "target_jurisdiction", "parameters"]
    }
}

async def handle_json_rpc(request: dict) -> dict:
    req_id = request.get("id")
    method = request.get("method")
    params = request.get("params", {})

    if method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "tools": [TOOL_DEFINITION]
            }
        }

    elif method == "tools/call":
        tool_name = params.get("name")
        arguments = params.get("arguments", {})

        if tool_name != "check_compliance":
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {
                    "code": -32601,
                    "message": f"Method or tool '{tool_name}' not found."
                }
            }

        async with AsyncSessionLocal() as db:
            result = await evaluate_mcp_compliance(
                db=db,
                action_type=arguments.get("action_type", "DATA_STORAGE"),
                target_jurisdiction=arguments.get("target_jurisdiction", "US_CFPB"),
                parameters=arguments.get("parameters", {}),
                actor="mcp.stdio_agent"
            )

        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "content": [
                    {
                        "type": "text",
                        "text": json.dumps(result, indent=2)
                    }
                ],
                "isError": not result.get("compliant", False)
            }
        }

    else:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {
                "code": -32601,
                "message": f"Unsupported method '{method}'"
            }
        }

async def main():
    await init_db()
    # Read from stdio
    loop = asyncio.get_event_loop()
    reader = asyncio.StreamReader()
    protocol = asyncio.StreamReaderProtocol(reader)
    await loop.connect_read_pipe(lambda: protocol, sys.stdin)

    while True:
        line = await reader.readline()
        if not line:
            break
        try:
            req = json.loads(line.decode().strip())
            resp = await handle_json_rpc(req)
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()
        except Exception as e:
            err_resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": f"Parse error: {str(e)}"}
            }
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    asyncio.run(main())
