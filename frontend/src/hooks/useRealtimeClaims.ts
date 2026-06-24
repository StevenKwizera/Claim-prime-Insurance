import { useEffect, useState } from "react";

import { getApiBaseUrl } from "@/config/apiBase";

const apiBase = () => getApiBaseUrl();

/**
 * Server-sent events for live claim pipeline updates.
 * Uses `access_token` query param because EventSource cannot send Authorization headers reliably.
 */
export const useRealtimeClaims = (token: string | null | undefined) => {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(
    token ? "Connecting to live events..." : "Sign in to enable live updates"
  );

  useEffect(() => {
    if (!token) {
      setConnected(false);
      setLastEvent("Sign in to enable live updates");
      return;
    }

    const url = `${apiBase()}/events?access_token=${encodeURIComponent(token)}`;
    const source = new EventSource(url);

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { message?: string };
        setLastEvent(payload.message ?? "Live claim status updates active");
      } catch {
        setLastEvent("Live claim status updates active");
      }
      setConnected(true);
    };

    source.onerror = () => {
      setConnected(false);
      setLastEvent("Realtime connection lost. Retrying…");
    };

    return () => {
      source.close();
    };
  }, [token]);

  return { connected, lastEvent };
};
