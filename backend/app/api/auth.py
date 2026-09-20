import hashlib
import os
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.database import get_db
from backend.app.models.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

def hash_password(password: str) -> str:
    """Deterministic PBKDF2 hash using standard library hashlib."""
    salt = "regdiff_secure_salt_2026".encode("utf-8")
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return key.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    organization: Optional[str] = "Independent Counsel"
    role: Optional[str] = "LEAD COUNSEL"

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    organization: str
    token: str

async def ensure_seed_users(db: AsyncSession):
    """Seed initial demo users if not present."""
    result = await db.execute(select(User).where(User.email == "alex.vance@regdiff.internal"))
    if not result.scalar_one_or_none():
        alex = User(
            id=uuid.uuid4(),
            email="alex.vance@regdiff.internal",
            hashed_password=hash_password("counsel2026"),
            full_name="Alex Vance",
            role="LEAD COUNSEL",
            organization="Apex Financial Technologies LLC"
        )
        judge = User(
            id=uuid.uuid4(),
            email="judge@lexhack.org",
            hashed_password=hash_password("lexhack2026"),
            full_name="LexHack Evaluator",
            role="CHIEF AUDITOR",
            organization="LexHack 2026 Grand Jury"
        )
        db.add_all([alex, judge])
        await db.commit()

@router.post("/login", response_model=UserResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    await ensure_seed_users(db)
    stmt = select(User).where(User.email == req.email.strip().lower())
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify credentials or use 1-Click Demo Login."
        )
        
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        organization=user.organization,
        token=f"regdiff_token_{user.id}"
    )

@router.post("/register", response_model=UserResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    email_clean = req.email.strip().lower()
    stmt = select(User).where(User.email == email_clean)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )
        
    new_user = User(
        id=uuid.uuid4(),
        email=email_clean,
        hashed_password=hash_password(req.password),
        full_name=req.full_name.strip(),
        organization=req.organization or "Independent Counsel",
        role=req.role or "LEAD COUNSEL"
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return UserResponse(
        id=str(new_user.id),
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role,
        organization=new_user.organization,
        token=f"regdiff_token_{new_user.id}"
    )

@router.post("/demo_login", response_model=UserResponse)
async def demo_login(db: AsyncSession = Depends(get_db)):
    """1-Click instant sign-in for Hackathon Judges & Evaluators."""
    await ensure_seed_users(db)
    stmt = select(User).where(User.email == "alex.vance@regdiff.internal")
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        organization=user.organization,
        token=f"regdiff_demo_token_{user.id}"
    )
