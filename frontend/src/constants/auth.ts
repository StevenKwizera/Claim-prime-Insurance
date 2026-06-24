/** Shared with authStore — keep in sync with login persistence */
export const AUTH_STORAGE_KEY = "prime-insurance-auth";

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { token?: string | null };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}
