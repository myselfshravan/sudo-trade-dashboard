import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, useCallback } from "react";
import { api, createWS, type WSEvent } from "@/lib/api";

export function useStatus() {
  return useQuery({
    queryKey: ["status"],
    queryFn: api.getStatus,
    refetchInterval: 3000,
    retry: 1,
  });
}

export function usePortfolio() {
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: api.getPortfolio,
    refetchInterval: 5000,
    retry: 1,
  });
}

export function usePending() {
  return useQuery({
    queryKey: ["pending"],
    queryFn: api.getPending,
    refetchInterval: 3000,
    retry: 1,
  });
}

export function useConsensus(symbol: string | null) {
  return useQuery({
    queryKey: ["consensus", symbol],
    queryFn: () => (symbol ? api.getConsensus(symbol) : null),
    enabled: !!symbol,
    refetchInterval: 5000,
    retry: 0,
  });
}

export function useWebSocket() {
  const [events, setEvents] = useState<WSEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const addEvent = useCallback((event: WSEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, 100));
  }, []);

  useEffect(() => {
    const ws = createWS((event) => {
      addEvent(event);
    });

    if (ws) {
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        // Reconnect after 3s
        setTimeout(() => {
          const newWs = createWS(addEvent);
          if (newWs) {
            wsRef.current = newWs;
            newWs.onopen = () => setConnected(true);
            newWs.onclose = () => setConnected(false);
          }
        }, 3000);
      };
    }

    return () => {
      wsRef.current?.close();
    };
  }, [addEvent]);

  return { events, connected, ws: wsRef.current };
}
