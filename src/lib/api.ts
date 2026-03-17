const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "/api" : "https://sudo-trade-api.droidvm.dev");
const WS_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/^http/, "ws")
  : import.meta.env.DEV
    ? `ws://${window.location.hostname}:8008`
    : "wss://sudo-trade-api.droidvm.dev";

export interface AgentState {
  state: "idle" | "running" | "waiting" | "paused" | "error" | "stopped" | "rate_limited";
}

export interface AgentInfo {
  state: string;
  profile: Record<string, unknown>;
}

export interface AgentSession {
  facts: Record<string, unknown>;
  messages: { role: string; content: string }[];
  message_count: number;
}

export interface AgentHistoryEntry {
  type: string;
  timestamp: string;
  agent: string;
  symbol?: string;
  confidence?: number;
  [key: string]: unknown;
}

export type TradingMode = "equity_intraday" | "equity_delivery" | "fno" | "all";

export interface ConfigData {
  TRADING_MODE: TradingMode;
  AGENT_FORCE_ACTIVE: boolean;
  AGENT_AUTO_EXECUTE: boolean;
  AGENT_DEBATE_ROUNDS: number;
  AGENT_DAILY_BUDGET_USD: number;
  AGENT_PER_AGENT_BUDGET_USD: number;
  AGENT_MASTER_BUDGET_USD: number;
  AGENT_MIN_CONFIDENCE: number;
  [key: string]: unknown;
}

export interface WatchlistData {
  symbols: string[];
}

export interface TimelineEvent {
  event: string;
  time: string;
  data: Record<string, unknown>;
}

export interface QuoteData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: string;
  exchange: string;
  extra: Record<string, unknown>;
}

export interface CostData {
  daily_budget: number;
  total_cost_usd: number;
  agents: Record<string, { tokens: number; cost_usd: number; calls: number }>;
}

export interface StatusData {
  master_state: string;
  phase: string;
  market_open: boolean;
  active_debates: string[];
  agents: Record<string, AgentState>;
  cost: CostData;
}

export interface Position {
  qty: number;
  avg_price: number;
}

export interface Trade {
  order_id: string;
  symbol: string;
  action: string;
  quantity: number;
  fill_price: number;
  timestamp: string;
  capital_after: number;
}

export interface PortfolioData {
  capital: number;
  positions: Record<string, Position>;
  pnl: number;
  trades: Trade[];
  total_trades: number;
}

export interface Signal {
  type: string;
  source: string;
  symbol: string;
  value: number;
  confidence: number;
  reasoning: string;
  timestamp: string;
}

export interface DebatePosition {
  agent_name: string;
  stance: "bull" | "bear";
  argument: string;
  confidence: number;
  evidence: string[];
  round: number;
}

export interface ConsensusResult {
  symbol: string;
  verdict: string;
  confidence: number;
  bull_score: number;
  bear_score: number;
  reasoning: string;
  positions: DebatePosition[];
}

export interface PendingSignal {
  action: string;
  symbol: string;
  quantity: number;
  confidence: number;
  reasoning: string;
  style: string;
  signals_used: string[];
  metadata: Record<string, unknown>;
}

export interface WSEvent {
  event: string;
  data: Record<string, unknown>;
  time: string;
}

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getStatus: () => fetchJSON<StatusData>("/status"),
  getPortfolio: () => fetchJSON<PortfolioData>("/portfolio"),
  getSignals: () => fetchJSON<Record<string, Signal[]>>("/signals"),
  getConsensus: (symbol: string) => fetchJSON<ConsensusResult>(`/consensus/${symbol}`),
  getPending: () => fetchJSON<{ pending: PendingSignal[] }>("/pending"),
  getCost: () => fetchJSON<CostData>("/cost"),
  postTask: (type: string, symbols: string[]) =>
    fetch(`${API_BASE}/task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, symbols }),
    }).then((r) => r.json()),
  approveTrade: (idx: number) =>
    fetch(`${API_BASE}/trade/approve/${idx}`, { method: "POST" }).then((r) => r.json()),
  rejectTrade: (idx: number) =>
    fetch(`${API_BASE}/trade/reject/${idx}`, { method: "POST" }).then((r) => r.json()),

  // Config
  getConfig: () => fetchJSON<ConfigData>("/config"),
  postConfig: (config: Partial<ConfigData>) =>
    fetch(`${API_BASE}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    }).then((r) => r.json()),

  // Watchlist
  getWatchlist: () => fetchJSON<WatchlistData>("/watchlist"),
  setWatchlist: (symbols: string[]) =>
    fetch(`${API_BASE}/watchlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols }),
    }).then((r) => r.json()),
  addToWatchlist: (symbol: string) =>
    fetch(`${API_BASE}/watchlist/${encodeURIComponent(symbol)}`, { method: "PUT" }).then((r) => r.json()),
  removeFromWatchlist: (symbol: string) =>
    fetch(`${API_BASE}/watchlist/${encodeURIComponent(symbol)}`, { method: "DELETE" }).then((r) => r.json()),

  // Agents
  getAgents: () => fetchJSON<Record<string, AgentInfo>>("/agents"),
  getAgentProfile: (name: string) => fetchJSON<Record<string, unknown>>(`/agents/${name}/profile`),
  getAgentHistory: (name: string, params?: { type?: string; symbol?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.symbol) qs.set("symbol", params.symbol);
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return fetchJSON<AgentHistoryEntry[]>(`/agents/${name}/history${q ? `?${q}` : ""}`);
  },
  getAgentSession: (name: string) => fetchJSON<AgentSession>(`/agents/${name}/session`),
  pauseAgent: (name: string) =>
    fetch(`${API_BASE}/agents/${name}/pause`, { method: "POST" }).then((r) => r.json()),
  resumeAgent: (name: string) =>
    fetch(`${API_BASE}/agents/${name}/resume`, { method: "POST" }).then((r) => r.json()),

  // Timeline
  getTimeline: (params?: { type?: string; from?: string; to?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return fetchJSON<TimelineEvent[]>(`/timeline${q ? `?${q}` : ""}`);
  },

  // Quotes
  getQuotes: (symbols: string[]) =>
    fetchJSON<QuoteData[]>(`/quotes?symbols=${symbols.map(encodeURIComponent).join(",")}`),

  // Positions
  closePosition: (symbol: string) =>
    fetch(`${API_BASE}/positions/${encodeURIComponent(symbol)}/close`, { method: "POST" }).then((r) => r.json()),
};

export function createWS(onEvent: (event: WSEvent) => void): WebSocket | null {
  try {
    const ws = new WebSocket(`${WS_BASE}/ws`);
    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as WSEvent;
        onEvent(event);
      } catch {}
    };
    return ws;
  } catch {
    return null;
  }
}
