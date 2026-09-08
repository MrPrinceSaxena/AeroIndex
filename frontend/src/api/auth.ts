import { API_BASE_URL } from "./client";
import type { AuthResponse, UserProfile, Persona } from "../types/auth";

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Authentication failed. Please verify credentials.");
  }
  return res.json();
}

export async function signupApi(data: {
  name: string;
  email: string;
  password: string;
  organization: string;
  role: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Registration failed. Please check inputs.");
  }
  return res.json();
}

export async function demoLoginApi(personaKey: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ persona_key: personaKey }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Demo persona login failed.");
  }
  return res.json();
}

export async function getCurrentUserApi(token: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error("Session expired.");
  }
  return res.json();
}

export async function fetchOfficialPersonasApi(): Promise<Persona[]> {
  const res = await fetch(`${API_BASE_URL}/auth/personas`);
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  return data.personas || [];
}
