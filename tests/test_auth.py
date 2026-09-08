"""
Unit & Integration tests for APIx Authentication System (PBKDF2-HMAC-SHA256 & Session Tokens)
"""

import pytest
from fastapi.testclient import TestClient
from src.api.main import app
from src.api.auth import hash_password, verify_password, generate_signed_token, verify_signed_token

client = TestClient(app)

def test_password_hashing_and_verification():
    raw = "SecurePassword@2026!"
    hashed_hex, salt = hash_password(raw)
    assert hashed_hex != raw
    assert len(salt) == 32  # 16 bytes hex
    assert verify_password(raw, hashed_hex, salt) is True
    assert verify_password("WrongPassword123", hashed_hex, salt) is False

def test_signed_token_generation_and_verification():
    user_id = "test-user-uuid"
    email = "officer@gov.in"
    role = "government"
    token = generate_signed_token(user_id, email, role)
    assert isinstance(token, str)
    assert "." in token
    payload = verify_signed_token(token)
    assert payload is not None
    assert payload["sub"] == user_id
    assert payload["email"] == email
    assert payload["role"] == role
    assert verify_signed_token("invalid.tampered.token") is None

def test_get_official_personas():
    response = client.get("/auth/personas")
    assert response.status_code == 200
    data = response.json()
    assert "personas" in data
    assert len(data["personas"]) >= 5
    keys = [p["key"] for p in data["personas"]]
    assert "mospi" in keys
    assert "dgca" in keys
    assert "rbi" in keys

def test_demo_persona_login():
    response = client.post("/auth/demo-login", json={"persona_key": "mospi"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "MoSPI" in data["user"]["role"]
    assert "Ministry of Statistics" in data["user"]["organization"]
    assert "token" in data
    assert data["token"] is not None

def test_signup_and_login_flow():
    email = "officer.sharma@gov.in"
    password = "GovPassword#2026!"
    signup_payload = {
        "name": "Dr. Rajesh Sharma",
        "email": email,
        "password": password,
        "organization": "Ministry of Statistics & Programme Implementation",
        "role": "government",
    }
    
    # 1. Signup
    res_signup = client.post("/auth/signup", json=signup_payload)
    assert res_signup.status_code == 200
    res_data = res_signup.json()
    assert res_data["success"] is True
    assert res_data["user"]["email"] == email
    token = res_data["token"]
    
    # 2. Duplicate signup check
    res_dup = client.post("/auth/signup", json=signup_payload)
    assert res_dup.status_code == 400
    
    # 3. Login
    res_login = client.post("/auth/login", json={"email": email, "password": password})
    assert res_login.status_code == 200
    login_data = res_login.json()
    assert login_data["success"] is True
    assert login_data["user"]["name"] == "Dr. Rajesh Sharma"
    
    # 4. Get Current User Profile via Bearer Token
    res_me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["email"] == email
    assert res_me.json()["api_key"].startswith("apix_live_")

def test_login_invalid_credentials():
    response = client.post("/auth/login", json={"email": "nonexistent@gov.in", "password": "wrong"})
    assert response.status_code == 401
