const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "/api" : "https://sudo-trade-api.droidvm.dev");
const WS_BASE = (import.meta.env.VITE_API_URL || "https://sudo-trade-api.droidvm.dev").replace(/^http/, "ws");

export interface AgentState {
  state: "idle" | "running" | "waiting" | "error" | "stopped" | "rate_limited";
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
