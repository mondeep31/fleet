const TOKEN_KEY = "fleet_token";
const USER_KEY = "fleet_user";
const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export interface StoredUser {
  userId: string;
  name: string;
  email: string;
}

function setTokenCookie(token: string): void {
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${TOKEN_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearTokenCookie(): void {
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `${TOKEN_KEY}=; path=/; expires=${expires}; max-age=0; SameSite=Lax`;
}

export function syncTokenCookie(token: string): void {
  setTokenCookie(token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuth(token: string, user: StoredUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setTokenCookie(token);
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearTokenCookie();
}
