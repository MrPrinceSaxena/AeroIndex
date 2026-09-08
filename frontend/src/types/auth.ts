export interface UserProfile {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: string;
  badge_title: string;
  clearance_level: string;
  avatar_url?: string | null;
  avatar_initials?: string;
  created_at: string;
  api_key: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: UserProfile;
}

export interface Persona {
  key: string;
  name: string;
  email: string;
  organization: string;
  role: string;
  badge_title: string;
  clearance_level: string;
  avatar_url?: string | null;
}
