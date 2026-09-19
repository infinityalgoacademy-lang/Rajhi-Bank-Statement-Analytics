/**
 * Authentication credentials and helpers.
 * IMPORTANT: This is a client-side gate for the dashboard UI.
 * The credentials are stored here for the protected demo.
 */

export const AUTH_EMAIL = "mr.msf515@gmail.com";
export const AUTH_PASSWORD = "mr.msf515";
export const AUTH_STORAGE_KEY = "alrajhi_auth_session";
export const AUTH_SESSION_DURATION_MS = 1000 * 60 * 60 * 24; // 24 hours

export interface AuthSession {
  email: string;
  loginAt: number;
  expiresAt: number;
}

/**
 * Validate email/password against the configured credentials.
 */
export function validateCredentials(email: string, password: string): boolean {
  return email.trim().toLowerCase() === AUTH_EMAIL.toLowerCase() && password === AUTH_PASSWORD;
}

/**
 * Save an authenticated session to localStorage.
 */
export function saveSession(email: string): AuthSession {
  const now = Date.now();
  const session: AuthSession = {
    email,
    loginAt: now,
    expiresAt: now + AUTH_SESSION_DURATION_MS,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }
  return session;
}

/**
 * Get the current authenticated session, or null if not authenticated / expired.
 */
export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (!session || !session.email || !session.expiresAt) return null;
    if (Date.now() > session.expiresAt) {
      // Expired — clear it
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Clear the current session (logout).
 */
export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}
