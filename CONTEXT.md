# Dashboard Context — Backend API Contract

> This document is the bridge between the backend (sudo-trade engine) and the frontend (React dashboard).
> The dashboard agent should read this to understand every API endpoint, WebSocket event, data shape, and the trading pipeline.

## Architecture

```
React Dashboard (this repo)
    ↕ HTTP + WebSocket
Engine API (localhost:8080)
    ↕ EventBus
6 AI Agents + MasterAgent + MarketScheduler
    ↕ LLM calls (Z.AI + Groq)
Groww Broker (market data) + PaperExecutor (simulated trades)
```

The dashboard is read + control. It reads system state and controls trade approval/rejection + manual task triggers.

## API Base URL

- Dev: `http://localhost:8080` (or proxied via Vite as `/api`)
- Prod: configurable via `VITE_API_URL` env var

---

## REST Endpoints

### GET /status

System-wide state. Poll every 3s.

```json
{
  "master_state": "idle",           // idle | running | error | stopped
  "phase": "morning",               // pre_market | opening | morning | afternoon | closing | post_market | closed
  "market_open": true,
  "active_debates": ["RELIANCE", "TCS"],
  "agents": {
    "researcher":     { "state": "idle" },
    "screener":       { "state": "running" },
    "debater_bull":   { "state": "idle" },
    "debater_bear":   { "state": "idle" },
    "analyst":        { "state": "idle" },
    "executor_agent": { "state": "idle" }
  },
  "cost": {
    "daily_budget": 50.0,
    "total_cost_usd": 0.0632,
    "agents": {
      "researcher":   { "tokens": 4467, "cost_usd": 0.0029, "calls": 1 },
      "debater_bull": { "tokens": 6170, "cost_usd": 0.0193, "calls": 4 },
      "debater_bear": { "tokens": 7631, "cost_usd": 0.0255, "calls": 4 },
      "master":       { "tokens": 7343, "cost_usd": 0.0156, "calls": 2 }
    }
  }
}
```

### GET /portfolio

Paper trading state. Poll every 5s.

```json
{
  "capital": 87500.50,
  "positions": {
    "RELIANCE": { "qty": 10, "avg_price": 1250.75 },
    "TCS":      { "qty": 5,  "avg_price": 3800.00 }
  },
  "pnl": 3420.50,
  "trades": [
    {
      "order_id": "PAPER-A1B2C3D4",
      "symbol": "RELIANCE",
      "action": "BUY",
      "quantity": 10,
      "fill_price": 1250.75,
      "timestamp": "2026-03-16T09:32:15.123456",
      "capital_after": 87493.50
    }
  ],
  "total_trades": 12
}
```

### GET /signals

Analysis signals grouped by symbol. Keys are `signals:{SYMBOL}`.

```json
{
  "signals:RELIANCE": [
    {
      "type": "sentiment",
      "source": "llm_sentiment",
      "symbol": "RELIANCE",
      "value": 0.65,           // -1.0 (bearish) to 1.0 (bullish)
      "confidence": 0.82,      // 0.0 to 1.0
      "reasoning": "Strong momentum with volume spike",
      "timestamp": "2026-03-16T10:15:00",
      "metadata": {
        "action": "BUY",
        "key_factors": ["revenue growth", "sector rotation"]
      }
    }
  ]
}
```

### GET /consensus/{SYMBOL}

Debate verdict for a specific stock. Returns 404 if no debate happened.

```json
{
  "symbol": "RELIANCE",
  "verdict": "strong_buy",      // strong_buy | buy | hold | sell | strong_sell
  "confidence": 0.78,
  "bull_score": 0.85,
  "bear_score": 0.45,
  "reasoning": "Bull case compelling — strong earnings, sector tailwinds outweigh valuation concerns",
  "positions": [
    {
      "agent_name": "debater_bull",
      "stance": "bull",
      "argument": "Reliance presents a compelling multi-decade...",
      "confidence": 0.82,
      "evidence": ["Q3 revenue +15%", "Jio subscriber growth", "Retail expansion"],
      "round": 0
    },
    {
      "agent_name": "debater_bear",
      "stance": "bear",
      "argument": "Reliance faces structural headwinds...",
      "confidence": 0.68,
      "evidence": ["O2C margins declining", "Debt-to-equity rising", "Regulatory risk"],
      "round": 0
    },
    {
      "agent_name": "debater_bull",
      "stance": "bull",
      "argument": "The bear's debt argument is misleading...",
      "confidence": 0.85,
      "evidence": ["Net debt actually decreased", "Cash flow covers interest 3x"],
      "round": 1
    },
    {
      "agent_name": "debater_bear",
      "stance": "bear",
      "argument": "Even accounting for cash flow...",
      "confidence": 0.72,
      "evidence": ["P/E at 28x vs sector avg 20x", "Capex risk in 5G"],
      "round": 1
    }
  ],
  "timestamp": "2026-03-16T09:45:00"
}
```

### GET /pending

Trades awaiting human approval (when `AGENT_AUTO_EXECUTE=false`).

```json
{
  "pending": [
    {
      "action": "buy",
      "symbol": "RELIANCE",
      "quantity": 0,              // 0 = ExecutionAgent will decide sizing
      "confidence": 0.78,
      "reasoning": "Strong bull consensus with high conviction",
      "style": "swing",          // intraday | swing | positional
      "product": "CNC",          // CNC | MIS | NRML
      "exchange": "NSE",
      "price_target": null,
      "stop_loss": null,
      "timestamp": "2026-03-16T10:00:00",
      "signals_used": [...],     // array of Signal objects that led to this
      "metadata": {}
    }
  ]
}
```

### GET /cost

LLM cost tracking (same data as in /status, dedicated endpoint).

```json
{
  "daily_budget": 50.0,
  "total_cost_usd": 0.0632,
  "agents": {
    "researcher":   { "tokens": 4467, "cost_usd": 0.0029, "calls": 1 },
    "debater_bull": { "tokens": 6170, "cost_usd": 0.0193, "calls": 4 },
    "master":       { "tokens": 7343, "cost_usd": 0.0156, "calls": 2 }
  }
}
```

### POST /task

Trigger agent tasks manually.

**Request:**
```json
{ "type": "research" }
{ "type": "screen", "symbols": ["RELIANCE", "TCS", "INFY"] }
{ "type": "debate", "symbols": ["RELIANCE"] }
{ "type": "analyze", "symbols": ["RELIANCE", "TCS"] }
```

**Response:**
```json
{ "status": "accepted", "task_id": "a1b2c3d4e5f6" }
```

### POST /trade/approve/{idx}

Approve pending trade at index. Triggers ExecutionAgent → LLM sizing → PaperExecutor.

**Response (success):**
```json
{
  "signal": { "action": "buy", "symbol": "RELIANCE", ... },
  "success": true,
  "order_id": "PAPER-A1B2C3D4",
  "broker": "paper",
  "message": "BUY 8 RELIANCE @ ₹1,250.75",
  "timestamp": "2026-03-16T10:05:00"
}
```

**Response (failure):**
```json
{ "error": "no pending signal at index" }
```

### POST /trade/reject/{idx}

Reject pending trade at index. Removes from queue.

**Response:**
```json
{ "status": "rejected", "symbol": "RELIANCE" }
```

---

## WebSocket — ws://localhost:8080/ws

Real-time event stream. Connect on mount, auto-reconnect on disconnect.

### Event Format

```json
{
  "event": "agent:debate:argument",
  "data": { ... },
  "time": "2026-03-16T10:15:00.123456"
}
```

### Events

| Event | When | Data |
|---|---|---|
| `agent:research:complete` | Research finished | `{ symbols: string[], findings: object[] }` |
| `agent:screened` | Screening finished | `{ symbols: string[], picks: object[] }` |
| `agent:debate:argument` | Bull or bear argued | `{ position: DebatePosition, symbol: string }` |
| `agent:debate:complete` | Debate judged | `{ symbol: string, consensus: ConsensusResult }` |
| `agent:analysis:complete` | Analysis finished | `{ symbols: string[], signals: Signal[] }` |
| `agent:trade:requested` | Master wants to trade | `{ signal: TradeSignal }` |
| `agent:trade:executed` | Trade filled | `{ result: TradeResult }` |
| `agent:trade:pending` | Trade queued for approval | `{ signal: TradeSignal, pending_count: number }` |
| `schedule:phase_change` | Market phase changed | `{ phase: string, old_phase: string, time: string }` |

---

## Agent Pipeline (What Happens When)

```
09:00 IST  PRE_MARKET
  → ResearchAgent scans MoneyControl + ET RSS feeds
  → LLM (Groq llama-3.3-70b) summarizes into insights
  → event: agent:research:complete

09:15 IST  OPENING
  → ScreenerAgent fetches quotes for ~120 stocks from Groww
  → Quantitative filter (sort by |change%|)
  → LLM (Groq llama-3.1-8b) ranks top 5
  → event: agent:screened

  → For top 3 picks, MasterAgent starts debates:
    → DebateAgent (bull) argues using Z.AI glm-5
    → event: agent:debate:argument (bull, round 0)
    → DebateAgent (bear) argues using Z.AI glm-5
    → event: agent:debate:argument (bear, round 0)
    → Bull rebuttal (round 1)
    → event: agent:debate:argument (bull, round 1)
    → Bear rebuttal (round 1)
    → event: agent:debate:argument (bear, round 1)
    → ConsensusEngine judges
    → event: agent:debate:complete

09:30 IST  MORNING
  → If consensus is BUY/SELL with >60% confidence:
    → AnalysisAgent runs sentiment analysis via Z.AI glm-4.7
    → event: agent:analysis:complete
    → MasterAgent makes final decision via Z.AI glm-5
    → event: agent:trade:requested
    → ExecutionAgent queues for approval
    → event: agent:trade:pending

  → Dashboard shows pending trade → User clicks APPROVE
    → POST /trade/approve/0
    → ExecutionAgent sizes position via Groq gpt-oss-120b
    → PaperExecutor simulates fill
    → event: agent:trade:executed

12:00 IST  AFTERNOON
  → Re-screen for afternoon opportunities
  → Same debate cycle

14:00 IST  CLOSING
  → No new positions

15:30 IST  POST_MARKET
  → Daily report generated
  → Agent memories saved to disk
```

## Agent → LLM Model Mapping

| Agent | Provider | Model | Speed | Purpose |
|---|---|---|---|---|
| Master | Z.AI | glm-5 | — | Final trading decisions |
| Debaters (bull+bear) | Z.AI | glm-5 | — | Argumentation with evidence |
| Analyst | Z.AI | glm-4.7 | — | Sentiment analysis |
| Researcher | Groq | llama-3.3-70b | 280 t/s | News summarization |
| Screener | Groq | llama-3.1-8b | 560 t/s | Stock ranking |
| Executor | Groq | gpt-oss-120b | 500 t/s | Position sizing |

## Market Phases

| Phase | IST Time | Dashboard Behavior |
|---|---|---|
| `closed` | 16:00-09:00 | Gray/dim, show "Market Closed" |
| `pre_market` | 09:00-09:15 | Yellow pulse, research activity |
| `opening` | 09:15-09:30 | Green, screening + debates starting |
| `morning` | 09:30-12:00 | Full green, trades happening |
| `afternoon` | 12:00-14:00 | Green, re-screening |
| `closing` | 14:00-15:30 | Orange, winding down |
| `post_market` | 15:30-16:00 | Yellow, daily report |

Force active mode (`AGENT_FORCE_ACTIVE=true`) makes the scheduler pretend it's always MORNING — useful for weekend testing.

## Pages the Dashboard Should Have

### 1. Overview (current `/` page)
- System status, agent grid, market phase bar
- Debate arena in center
- Ledger (portfolio, pending, trades, cost) on right

### 2. Portfolio `/portfolio`
- Capital chart over time (use trades[] timestamps for equity curve)
- Open positions table with current value, unrealized P&L
- Closed trades history with filters (date range, symbol, action)
- Win rate, avg P&L per trade stats

### 3. Debates `/debates`
- List of all debated symbols (from consensus results)
- Click symbol → full debate transcript (all 4 arguments)
- Verdict badge, confidence meter, bull/bear score bars
- URL: `/debates/RELIANCE` shows that debate

### 4. Signals `/signals`
- All analysis signals in a table/grid
- Filter by symbol, signal type, confidence range
- Color-coded value bars (-1 to +1)

### 5. Agents `/agents`
- Per-agent detail page with stats from memory
- Memory profile: total tasks, win rate, avg confidence
- Recent history: last 20 events per agent
- LLM cost per agent (bar chart)
- URL: `/agents/debater_bull`

### 6. Research `/research`
- Research findings timeline
- Source quality (which RSS feeds produce useful insights)
- Symbols mentioned in news

### 7. Settings `/settings`
- View current config (capital, budget, models per agent)
- Toggle force_active mode
- Toggle auto_execute mode
- These would need new API endpoints (currently config is read-only)

## URL Params for State

- `/debates?symbol=RELIANCE` — pre-select symbol
- `/portfolio?from=2026-03-01&to=2026-03-16` — date range filter
- `/signals?symbol=TCS&min_confidence=0.7` — filters
- `/agents?name=debater_bull` — select agent

## Data Refresh Strategy

| Data | Method | Interval | Notes |
|---|---|---|---|
| Status | React Query poll | 3s | Lightweight |
| Portfolio | React Query poll | 5s | Medium |
| Pending | React Query poll | 3s | Need fast approval UX |
| Consensus | React Query (on demand) | 5s | Only when viewing debate |
| Signals | React Query poll | 10s | Less frequent |
| Live events | WebSocket | Real-time | Debates, trades, phase changes |

## State Management

Current: React Query for server state (good).

Recommended additions:
- URL search params via `useSearchParams()` for filters/selections
- Local state (useState) for UI-only state (selected tab, expanded cards)
- No need for zustand/jotai — React Query + URL params covers it

## Design Language

Current: Dark monospace terminal aesthetic with `font-mono`, `tracking-widest`, `text-[10px]`. Keep this — it fits the trading terminal vibe.

Colors:
- `text-bull` / `bg-bull` — green for buy/bullish
- `text-bear` / `bg-bear` — red for sell/bearish
- `text-accent` — highlight/active
- `text-muted-foreground` — secondary text

### GET /research

All research findings grouped by symbol.

```json
{
  "research:RELIANCE": [
    {
      "headline": "Reliance Q3 earnings beat estimates",
      "impact": "bullish",
      "significance": "high",
      "horizon": "short_term",
      "reasoning": "Revenue up 15% YoY, Jio subscriber base growing"
    }
  ],
  "research:SBI": [...]
}
```

### GET /agents/{name}/profile

Agent memory profile (L0 stats). Name = `researcher`, `screener`, `debater_bull`, `debater_bear`, `analyst`, `executor_agent`, `master`.

```json
{
  "total_debates": 47,
  "total_debates_won": 28,
  "avg_confidence": 0.72
}
```

### GET /agents/{name}/history?type=debate&symbol=RELIANCE&limit=20

Agent event history (L2 — append-only log). All params optional.

```json
[
  {
    "type": "debate",
    "timestamp": "2026-03-16T10:15:00",
    "agent": "debater_bull",
    "symbol": "RELIANCE",
    "stance": "bull",
    "confidence": 0.82,
    "round": 0,
    "argument_preview": "Reliance presents a compelling..."
  }
]
```

---

## What's NOT in the API Yet

1. **Config mutation** — no POST endpoint for changing settings at runtime (force_active, auto_execute, budget). Dashboard would need to show these as read-only until we add `POST /config`
2. **Equity curve history** — compute client-side from `trades[].capital_after` timestamps
