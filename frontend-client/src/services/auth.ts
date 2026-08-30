import { API_URL, apiRequest } from "./api";

const ACCESS_TOKEN_KEY = "forgeiq.accessToken";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  memberships: Array<{ organizationId: string; role: string }>;
};

type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getGoogleAuthUrl() {
  return `${API_URL}/auth/google`;
}

export async function login(email: string, password: string) {
  const response = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
  return response.user;
}

export async function register(email: string, password: string, displayName?: string) {
  const response = await apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, displayName: displayName || undefined }),
  });
  localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
  return response.user;
}

export async function getCurrentUser() {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  try {
    const response = await apiRequest<{ user: AuthUser }>("/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.user;
  } catch {
    clearAccessToken();
    return null;
  }
}