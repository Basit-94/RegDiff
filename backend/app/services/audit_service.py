import json
import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.models.models import AuditLedger

GENESIS_HASH = "0" * 64

def format_canonical_timestamp(ts: Any) -> str:
    """Canonicalize timestamp across PostgreSQL, SQLite, and Python datetimes."""
    if isinstance(ts, datetime):
        return ts.strftime("%Y-%m-%d %H:%M:%S")
    s = str(ts).replace("T", " ").split("+")[0].split("Z")[0].strip()
    return s[:19]

def compute_block_hash(
    index: int,
    timestamp: Any,
    event_type: str,
    actor: str,
    payload: Dict[str, Any],
    previous_hash: str
) -> str:
    """Computes SHA-256 hash across canonical serialized block content."""
    canonical_payload = json.dumps(payload, sort_keys=True, default=str)
    ts_str = format_canonical_timestamp(timestamp)
    raw = f"{index}|{ts_str}|{event_type}|{actor}|{canonical_payload}|{previous_hash}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

async def record_audit_event(
    db: AsyncSession,
    event_type: str,
    actor: str,
    payload: Dict[str, Any]
) -> AuditLedger:
    """
    Appends a new immutable event to the cryptographic audit ledger.
    Guarantees strict hash-chaining with previous entry.
    """
    # Fetch last block
    stmt = select(AuditLedger).order_by(desc(AuditLedger.index)).limit(1)
    result = await db.execute(stmt)
    last_block = result.scalar_one_or_none()

    if last_block is None:
        next_index = 1
        previous_hash = GENESIS_HASH
    else:
        next_index = last_block.index + 1
        previous_hash = last_block.current_hash

    now = datetime.now(timezone.utc)
    current_hash = compute_block_hash(
        index=next_index,
        timestamp=now,
        event_type=event_type,
        actor=actor,
        payload=payload,
        previous_hash=previous_hash
    )

    entry = AuditLedger(
        index=next_index,
        timestamp=now,
        event_type=event_type,
        actor=actor,
        payload=payload,
        previous_hash=previous_hash,
        current_hash=current_hash
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry

async def verify_chain_integrity(db: AsyncSession) -> Tuple[bool, Optional[str], int]:
    """
    Verifies the cryptographic chain integrity of the entire audit ledger.
    Returns (is_valid, error_reason, total_blocks_checked).
    """
    stmt = select(AuditLedger).order_by(AuditLedger.index.asc())
    result = await db.execute(stmt)
    blocks: List[AuditLedger] = list(result.scalars().all())

    if not blocks:
        return True, None, 0

    prev_hash = GENESIS_HASH
    for b in blocks:
        if b.previous_hash != prev_hash:
            return False, f"Broken link at block #{b.index}: expected previous_hash {prev_hash}, got {b.previous_hash}", len(blocks)
        
        expected_current = compute_block_hash(
            index=b.index,
            timestamp=b.timestamp,
            event_type=b.event_type,
            actor=b.actor,
            payload=b.payload,
            previous_hash=b.previous_hash
        )
        if b.current_hash != expected_current:
            return False, f"Checksum mismatch at block #{b.index}: computed {expected_current}, recorded {b.current_hash}", len(blocks)
        
        prev_hash = b.current_hash

    return True, None, len(blocks)
