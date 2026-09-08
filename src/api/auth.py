"""
src/api/auth.py

Authentication, Role-Based Access Control, and Demo Personas for APIx.
Provides PBKDF2-HMAC-SHA256 password hashing, signed session tokens,
pre-configured official personas for evaluators, and API key management.
"""

from __future__ import annotations
import os
import time
import json
import base64
import hmac
import hashlib
import secrets
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

# Secret key for signing tokens
JWT_SECRET = os.getenv("APIX_AUTH_SECRET", "apix-sih26056-cryptographic-auth-key-2026")

# In-memory user store (persists during process lifetime, seeded with official roles)
USERS_DB: Dict[str, Dict[str, Any]] = {}
SESSIONS_DB: Dict[str, Dict[str, Any]] = {}

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    organization: str
    role: str
    badge_title: str
    clearance_level: str
    avatar_url: Optional[str] = None
    created_at: str
    api_key: str

class SignUpRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=6)
    organization: str = Field("General Research", min_length=2)
    role: str = Field("Researcher", min_length=2)

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=120)
    password: str

class DemoLoginRequest(BaseModel):
    persona_key: str  # 'mospi', 'dgca', 'rbi', 'airline', 'researcher'

class AuthResponse(BaseModel):
    success: bool
    message: str
    token: str
    user: UserProfile

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return hashed.hex(), salt

def verify_password(password: str, hashed_hex: str, salt: str) -> bool:
    new_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(new_hash, hashed_hex)

def generate_signed_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": int(time.time()),
        "exp": int(time.time()) + (86400 * 30),  # 30 days
        "nonce": secrets.token_hex(8),
    }
    raw = json.dumps(payload, separators=(",", ":"))
    b64_payload = base64.urlsafe_b64encode(raw.encode("utf-8")).decode("utf-8").rstrip("=")
    sig = hmac.new(JWT_SECRET.encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{b64_payload}.{sig}"

def verify_signed_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        if "." not in token:
            return None
        b64_payload, sig = token.split(".", 1)
        expected_sig = hmac.new(JWT_SECRET.encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        # Add padding back if needed
        rem = len(b64_payload) % 4
        padded = b64_payload + ("=" * (4 - rem) if rem else "")
        payload = json.loads(base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8"))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None

def generate_api_key(prefix: str = "apix_live") -> str:
    return f"{prefix}_{secrets.token_urlsafe(24)}"

# Seed Pre-configured Official Personas
OFFICIAL_PERSONAS: Dict[str, Dict[str, Any]] = {
    "mospi": {
        "id": "usr_mospi_officer_01",
        "name": "Dr. Rajiv Sharma",
        "email": "mospi.analyst@gov.in",
        "password": "Password@123",
        "organization": "Ministry of Statistics & Programme Implementation",
        "role": "MoSPI Senior Statistical Officer",
        "badge_title": "National Macro Deflators",
        "clearance_level": "Level 3: National Statistics Authority",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    "dgca": {
        "id": "usr_dgca_tariff_02",
        "name": "Ananya Verma",
        "email": "dgca.tariff@gov.in",
        "password": "Password@123",
        "organization": "Directorate General of Civil Aviation",
        "role": "DGCA Tariff Compliance Lead",
        "badge_title": "Rule 135 Regulatory Unit",
        "clearance_level": "Level 3: Tariff Monitoring Authority",
        "avatar_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    },
    "rbi": {
        "id": "usr_rbi_economist_03",
        "name": "Dr. Arvind Nambiar",
        "email": "rbi.macro@rbi.org.in",
        "password": "Password@123",
        "organization": "Reserve Bank of India",
        "role": "RBI Monetary Policy Analyst",
        "badge_title": "High-Frequency Inflation Research",
        "clearance_level": "Level 2: Central Banking Research",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    "airline": {
        "id": "usr_indigo_yield_04",
        "name": "Siddharth Kapoor",
        "email": "indigo.yield@goindigo.in",
        "password": "Password@123",
        "organization": "IndiGo Airlines Revenue Management",
        "role": "Airline Yield & Network Strategist",
        "badge_title": "Corridor Elasticity & Pricing",
        "clearance_level": "Level 2: Commercial Air Transport",
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
    "researcher": {
        "id": "usr_academic_iitd_05",
        "name": "Prof. Vikramaditya Sen",
        "email": "v.sen@iitd.ac.in",
        "password": "Password@123",
        "organization": "IIT Delhi • Center for Transportation Studies",
        "role": "Aviation Economics Researcher",
        "badge_title": "Empirical Econometrics",
        "clearance_level": "Level 1: Academic & Open Data Access",
        "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    },
}

def seed_official_users():
    for key, p in OFFICIAL_PERSONAS.items():
        if p["email"] not in USERS_DB:
            hashed, salt = hash_password(p["password"])
            USERS_DB[p["email"]] = {
                "id": p["id"],
                "name": p["name"],
                "email": p["email"],
                "password_hash": hashed,
                "salt": salt,
                "organization": p["organization"],
                "role": p["role"],
                "badge_title": p["badge_title"],
                "clearance_level": p["clearance_level"],
                "avatar_url": p["avatar_url"],
                "created_at": "2026-08-15T09:00:00Z",
                "api_key": generate_api_key(f"apix_{key}"),
            }

# Seed on module import
seed_official_users()

def register_user(req: SignUpRequest) -> tuple[UserProfile, str]:
    email_clean = req.email.lower().strip()
    if email_clean in USERS_DB:
        raise ValueError("An account with this official email address already exists.")
    
    user_id = f"usr_{secrets.token_hex(6)}"
    hashed, salt = hash_password(req.password)
    api_key = generate_api_key()
    created_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    # Map role to clearance
    role_lower = req.role.lower()
    if "mospi" in role_lower or "government" in role_lower or "ministry" in role_lower:
        clearance = "Level 3: National Statistics Authority"
        badge = "MoSPI Officer Clearance"
    elif "dgca" in role_lower or "regulator" in role_lower or "tariff" in role_lower:
        clearance = "Level 3: Tariff Monitoring Authority"
        badge = "DGCA Regulatory Clearance"
    elif "rbi" in role_lower or "central bank" in role_lower:
        clearance = "Level 2: Central Banking Research"
        badge = "RBI Economic Officer"
    elif "airline" in role_lower or "ota" in role_lower or "revenue" in role_lower:
        clearance = "Level 2: Commercial Air Transport"
        badge = "Airline Yield Access"
    else:
        clearance = "Level 1: Academic & Open Access"
        badge = "Verified Researcher"

    user_dict = {
        "id": user_id,
        "name": req.name.strip(),
        "email": email_clean,
        "password_hash": hashed,
        "salt": salt,
        "organization": req.organization.strip(),
        "role": req.role.strip(),
        "badge_title": badge,
        "clearance_level": clearance,
        "avatar_url": None,
        "created_at": created_at,
        "api_key": api_key,
    }
    USERS_DB[email_clean] = user_dict

    token = generate_signed_token(user_id, email_clean, user_dict["role"])
    profile = UserProfile(
        id=user_id,
        name=user_dict["name"],
        email=user_dict["email"],
        organization=user_dict["organization"],
        role=user_dict["role"],
        badge_title=user_dict["badge_title"],
        clearance_level=user_dict["clearance_level"],
        avatar_url=user_dict["avatar_url"],
        created_at=user_dict["created_at"],
        api_key=user_dict["api_key"],
    )
    return profile, token

def authenticate_user(email: str, password: str) -> tuple[UserProfile, str]:
    email_clean = email.lower().strip()
    user_dict = USERS_DB.get(email_clean)
    if not user_dict:
        raise ValueError("Invalid email or password. Please check your credentials.")
    
    if not verify_password(password, user_dict["password_hash"], user_dict["salt"]):
        raise ValueError("Invalid email or password. Please check your credentials.")
    
    token = generate_signed_token(user_dict["id"], email_clean, user_dict["role"])
    profile = UserProfile(
        id=user_dict["id"],
        name=user_dict["name"],
        email=user_dict["email"],
        organization=user_dict["organization"],
        role=user_dict["role"],
        badge_title=user_dict["badge_title"],
        clearance_level=user_dict["clearance_level"],
        avatar_url=user_dict["avatar_url"],
        created_at=user_dict["created_at"],
        api_key=user_dict["api_key"],
    )
    return profile, token

def authenticate_demo_persona(persona_key: str) -> tuple[UserProfile, str]:
    key = persona_key.lower().strip()
    persona = OFFICIAL_PERSONAS.get(key)
    if not persona:
        raise ValueError(f"Unknown demo persona '{persona_key}'. Available: {list(OFFICIAL_PERSONAS.keys())}")
    
    email = persona["email"]
    user_dict = USERS_DB.get(email)
    if not user_dict:
        seed_official_users()
        user_dict = USERS_DB[email]
    
    token = generate_signed_token(user_dict["id"], email, user_dict["role"])
    profile = UserProfile(
        id=user_dict["id"],
        name=user_dict["name"],
        email=user_dict["email"],
        organization=user_dict["organization"],
        role=user_dict["role"],
        badge_title=user_dict["badge_title"],
        clearance_level=user_dict["clearance_level"],
        avatar_url=user_dict["avatar_url"],
        created_at=user_dict["created_at"],
        api_key=user_dict["api_key"],
    )
    return profile, token

def get_user_from_token(token: str) -> Optional[UserProfile]:
    payload = verify_signed_token(token)
    if not payload:
        return None
    email = payload.get("email")
    if not email or email not in USERS_DB:
        return None
    user_dict = USERS_DB[email]
    return UserProfile(
        id=user_dict["id"],
        name=user_dict["name"],
        email=user_dict["email"],
        organization=user_dict["organization"],
        role=user_dict["role"],
        badge_title=user_dict["badge_title"],
        clearance_level=user_dict["clearance_level"],
        avatar_url=user_dict["avatar_url"],
        created_at=user_dict["created_at"],
        api_key=user_dict["api_key"],
    )
