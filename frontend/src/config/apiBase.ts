/**
 * In dev, use `/api` so Vite proxies to Spring Boot (avoids CORS and port mismatches).
 * In production, set VITE_API_BASE_URL or default to localhost:4000.
 */
export const getApiBaseUrl = (): string => {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (fromEnv?.trim()) {
    return fromEnv.trim().replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return "/api";
  }
  return "http://localhost:4000/api";
};
