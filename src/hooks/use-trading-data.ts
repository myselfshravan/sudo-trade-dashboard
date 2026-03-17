import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: api.getConfig,
    refetchInterval: 30000,
    retry: 1,
  });
}

export function useSaveConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.postConfig,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["config"] }),
  });
}

export function useWatchlist() {
  return useQuery({
    queryKey: ["watchlist"],
    queryFn: api.getWatchlist,
    refetchInterval: 10000,
    retry: 1,
  });
}

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: api.getAgents,
    refetchInterval: 5000,
    retry: 1,
  });
}

export function useAgentProfile(name: string | null) {
  return useQuery({
    queryKey: ["agent-profile", name],
    queryFn: () => (name ? api.getAgentProfile(name) : null),
    enabled: !!name,
    refetchInterval: 10000,
    retry: 0,
  });
}

export function useAgentSession(name: string | null) {
  return useQuery({
    queryKey: ["agent-session", name],
    queryFn: () => (name ? api.getAgentSession(name) : null),
    enabled: !!name,
    refetchInterval: 10000,
    retry: 0,
  });
}

export function useAgentHistory(name: string | null, params?: { type?: string; symbol?: string; limit?: number }) {
  return useQuery({
    queryKey: ["agent-history", name, params],
    queryFn: () => (name ? api.getAgentHistory(name, params) : null),
    enabled: !!name,
    refetchInterval: 10000,
    retry: 0,
  });
}

export function useTimeline(params?: { type?: string; from?: string; to?: string; limit?: number }) {
  return useQuery({
    queryKey: ["timeline", params],
    queryFn: () => api.getTimeline(params),
    refetchInterval: 10000,
    retry: 1,
  });
}

export function useSignals() {
  return useQuery({
    queryKey: ["signals"],
    queryFn: api.getSignals,
    refetchInterval: 10000,
    retry: 1,
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
