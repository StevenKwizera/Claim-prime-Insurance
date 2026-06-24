import axios from "axios";
import toast from "react-hot-toast";
import { getApiBaseUrl } from "@/config/apiBase";
import { AUTH_STORAGE_KEY, getStoredAuthToken } from "@/constants/auth";

export const api = axios.create({
  baseURL: getApiBaseUrl()
});

const isPublicAuthUrl = (url?: string) =>
  Boolean(
    url?.includes("/auth/login") ||
      url?.includes("/auth/register") ||
      url?.includes("/auth/password-reset/") ||
      url?.includes("/auth/demo-accounts") ||
      url?.includes("/auth/otp/") ||
      url?.includes("/auth/login/verify-otp") ||
      url?.includes("/auth/mail/")
  );

api.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  if (token && !isPublicAuthUrl(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const isPublicAuthCall = axios.isAxiosError(error) && isPublicAuthUrl(error.config?.url);

    if (status === 401 && typeof window !== "undefined" && !isPublicAuthCall) {
      const method = axios.isAxiosError(error) ? error.config?.method?.toLowerCase() : "";
      const url = axios.isAxiosError(error) ? error.config?.url ?? "" : "";
      const isMutation = method === "post" || method === "patch" || method === "put" || method === "delete";
      const isOptionalRead = method === "get" && (url.includes("/notifications") || url.includes("/analytics"));
      if (isMutation || isOptionalRead) {
        return Promise.reject(error);
      }
      try {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      toast.error("Session expired. Please sign in again.");
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);
