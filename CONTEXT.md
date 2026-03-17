# Dashboard Context — Backend API Contract (v2)

> Complete API reference for the React dashboard. 28 endpoints.
> The engine runs on `localhost:8080`. Dashboard talks to it via HTTP + WebSocket.

## API Overview

| Method | Path | What | Category |
|--------|------|------|----------|
| GET | `/status` | System state, agents, phase, cost | Read |
| GET | `/portfolio` | Capital, positions, P&L, trades | Read |
| GET | `/signals` | Analysis signals by symbol | Read |
| GET | `/consensus/{symbol}` | Debate verdict | Read |
| GET | `/pending` | Trades awaiting approval | Read |
| GET | `/cost` | LLM cost report | Read |
| GET | `/research` | Research findings by symbol | Read |
| GET | `/config` | Current runtime config | Read |
| GET | `/watchlist` | Current watchlist symbols | Read |
| GET | `/timeline` | Persisted event history | Read |
| GET | `/quotes` | Live market quotes | Read |
| GET | `/agents` | All agents + state + profiles | Read |
| GET | `/agents/{name}/profile` | Agent L0 memory stats | Read |
| GET | `/agents/{name}/history` | Agent L2 event log | Read |
| GET | `/agents/{name}/session` | Agent L1 session state | Read |
| POST | `/task` | Submit task (research/screen/debate/analyze) | Control |
| POST | `/config` | Update runtime config | Control |
| POST | `/trade/approve/{idx}` | Approve pending trade | Control |
| POST | `/trade/reject/{idx}` | Reject pending trade | Control |
| POST | `/agents/{name}/pause` | Pause agent | Control |
| POST | `/agents/{name}/resume` | Resume agent | Control |
| POST | `/positions/{symbol}/close` | Close position | Control |
| GET | `/watchlist` | Read watchlist | Watchlist |
| POST | `/watchlist` | Replace watchlist | Watchlist |
| PUT | `/watchlist/{symbol}` | Add to watchlist | Watchlist |
| DELETE | `/watchlist/{symbol}` | Remove from watchlist | Watchlist |
| GET | `/ws` | Real-time event stream | WebSocket |

---

## Endpoint Details

### GET /status
```json
{
  "master_state": "idle",
  "phase": "morning",
  "market_open": true,
  "active_debates": ["RELIANCE", "TCS"],
  "agents": {
    "researcher": { "state": "idle" },
    "screener": { "state": "paused" },
    "debater_bull": { "state": "running" },
    "debater_bear": { "state": "running" },
    "analyst": { "state": "idle" },
    "executor_agent": { "state": "idle" }
  },
  "cost": {
    "daily_budget": 50.0,
    "total_cost_usd": 0.0632,
    "agents": { "researcher": { "tokens": 4467, "cost_usd": 0.0029, "calls": 1 } }
  }
}
```
Agent states: `idle` | `running` | `waiting` | `paused` | `rate_limited` | `error` | `stopped`

### GET /portfolio
```json
{
  "capital": 87500.50,
  "positions": { "RELIANCE": { "qty": 10, "avg_price": 1250.75 } },
  "pnl": 3420.50,
  "trades": [{ "order_id": "PAPER-A1B2C3D4", "symbol": "RELIANCE", "action": "BUY", "quantity": 10, "fill_price": 1250.75, "timestamp": "2026-03-17T09:32:15", "capital_after": 87493.50 }],
  "total_trades": 12
}
```

### GET /config
```json
{
  "AGENT_FORCE_ACTIVE": false,
  "AGENT_AUTO_EXECUTE": false,
  "AGENT_DEBATE_ROUNDS": 2,
  "AGENT_DAILY_BUDGET_USD": 50.0,
  "AGENT_PER_AGENT_BUDGET_USD": 10.0,
  "AGENT_MASTER_BUDGET_USD": 20.0,
  "AGENT_MIN_CONFIDENCE": 0.6
}
```

### POST /config
Update runtime config. Changes propagate to running agents immediately.
```json
{
  "AGENT_FORCE_ACTIVE": true,
  "AGENT_AUTO_EXECUTE": false,
  "AGENT_DEBATE_ROUNDS": 3,
  "AGENT_DAILY_BUDGET_USD": 100.0
}
```
Response: `{ "status": "updated", "keys": ["AGENT_FORCE_ACTIVE", "AGENT_DEBATE_ROUNDS", ...] }`

### GET /watchlist
```json
{ "symbols": ["RELIANCE", "TCS", "INFY", "SUZLON"] }
```

### POST /watchlist — replace entire watchlist
```json
{ "symbols": ["RELIANCE", "TCS", "SUZLON", "RVNL"] }
```

### PUT /watchlist/{symbol} — add to watchlist
Response: `{ "status": "added", "symbol": "SUZLON", "watchlist": [...] }`

### DELETE /watchlist/{symbol} — remove from watchlist
Response: `{ "status": "removed", "symbol": "SUZLON", "watchlist": [...] }`

### GET /agents
All agents with state + memory profile stats.
```json
{
  "researcher": { "state": "idle", "profile": { "total_researches": 5, "total_insights": 42 } },
  "debater_bull": { "state": "paused", "profile": { "total_debates": 10, "wins": 6 } },
  "master": { "state": "idle", "profile": { "total_decisions": 8 } }
}
```

### GET /agents/{name}/profile — L0 stats
```json
{ "total_debates": 47, "avg_confidence": 0.72 }
```

### GET /agents/{name}/history — L2 event log
Query: `?type=debate&symbol=RELIANCE&limit=20`
```json
[{ "type": "debate", "timestamp": "2026-03-17T10:15:00", "agent": "debater_bull", "symbol": "RELIANCE", "confidence": 0.82 }]
```

### GET /agents/{name}/session — L1 session
```json
{
  "facts": { "last_research_count": 14 },
  "messages": [{ "role": "assistant", "content": "Analysis shows..." }],
  "message_count": 5
}
```

### POST /agents/{name}/pause
Response: `{ "status": "paused", "agent": "researcher" }`

### POST /agents/{name}/resume
Response: `{ "status": "resumed", "agent": "researcher" }`

### GET /timeline — persisted event history
Query: `?type=agent:debate:argument&from=2026-03-17T09:00&to=2026-03-17T15:30&limit=100`
```json
[{ "event": "agent:debate:argument", "time": "2026-03-17T10:15:00", "data": { "symbol": "RELIANCE", "position": {...} } }]
```

### GET /quotes — live market data
Query: `?symbols=RELIANCE,TCS,INFY`
```json
[{ "symbol": "RELIANCE", "price": 1250.75, "volume": 1234567, "timestamp": "2026-03-17T10:15:00", "exchange": "NSE", "extra": { "ohlc": {...}, "day_change_perc": 1.2 } }]
```

### GET /consensus/{symbol}
```json
{
  "symbol": "RELIANCE",
  "verdict": "strong_buy",
  "confidence": 0.78,
  "bull_score": 0.85,
  "bear_score": 0.45,
  "reasoning": "Bull case compelling...",
  "positions": [
    { "agent_name": "debater_bull", "stance": "bull", "argument": "...", "confidence": 0.82, "evidence": ["Q3 revenue +15%"], "round": 0 },
    { "agent_name": "debater_bear", "stance": "bear", "argument": "...", "confidence": 0.68, "evidence": ["P/E at 28x"], "round": 0 },
    { "agent_name": "debater_bull", "stance": "bull", "argument": "...", "confidence": 0.85, "evidence": ["..."], "round": 1 },
    { "agent_name": "debater_bear", "stance": "bear", "argument": "...", "confidence": 0.72, "evidence": ["..."], "round": 1 }
  ]
}
```

### GET /pending
```json
{
  "pending": [{
    "action": "buy", "symbol": "RELIANCE", "quantity": 0, "confidence": 0.78,
    "reasoning": "Strong bull consensus", "style": "swing", "product": "CNC"
  }]
}
```

### POST /task
```json
{ "type": "research" }
{ "type": "screen", "symbols": ["RELIANCE", "TCS"] }
{ "type": "debate", "symbols": ["RELIANCE"] }
{ "type": "analyze", "symbols": ["RELIANCE", "TCS"] }
```
Response: `{ "status": "accepted", "task_id": "a1b2c3d4e5f6" }`

### POST /positions/{symbol}/close
Closes entire position. If auto_execute=false, queues for approval.
Response: `{ "status": "queued_for_approval", "symbol": "RELIANCE", "qty": 10 }`

---

## WebSocket — ws://localhost:8080/ws

Events streamed in real-time:

| Event | Data | When |
|---|---|---|
| `agent:research:complete` | `{ symbols, findings }` | Research done |
| `agent:screened` | `{ symbols, picks }` | Screening done |
| `agent:debate:argument` | `{ position, symbol }` | Bull/bear argued |
| `agent:debate:complete` | `{ symbol, consensus }` | Debate judged |
| `agent:analysis:complete` | `{ symbols, signals }` | Analysis done |
| `agent:trade:requested` | `{ signal }` | Master wants to trade |
| `agent:trade:executed` | `{ result }` | Trade filled |
| `agent:trade:pending` | `{ signal, pending_count }` | Trade queued |
| `schedule:phase_change` | `{ phase, old_phase, time }` | Market phase changed |

---

## Dashboard Pages

### 1. Overview `/`
- Status bar: phase, market open/closed, WS connection
- Agent grid with pause/resume buttons
- Debate arena (center)
- Ledger: portfolio, pending trades, cost (right sidebar)

### 2. Portfolio `/portfolio`
- Capital + P&L (compute equity curve from trades[].capital_after)
- Positions table with close buttons (POST /positions/{sym}/close)
- Trade log with filters (date, symbol, action)
- Win rate, avg P&L stats

### 3. Debates `/debates`
- List of debated symbols (from /timeline?type=agent:debate:complete)
- Click → full debate transcript (4 arguments, verdict, scores)
- URL: `/debates?symbol=RELIANCE`

### 4. Agents `/agents`
- Agent cards with state, profile stats, last activity
- Pause/resume toggle per agent
- Memory viewer: profile (L0), session (L1), history (L2)
- LLM cost per agent
- URL: `/agents?name=debater_bull`

### 5. Watchlist `/watchlist`
- Current symbols with add/remove
- Search to add new symbols
- Trigger screen/debate from watchlist

### 6. Timeline `/timeline`
- Event log with filters (type, date range)
- Real-time via WebSocket + historical via GET /timeline
- URL: `/timeline?type=agent:debate:argument&from=2026-03-17T09:00`

### 7. Settings `/settings`
- All config values from GET /config
- Toggle switches for force_active, auto_execute
- Sliders for debate_rounds, min_confidence
- Number inputs for budget values
- Save → POST /config

---

## Agent → LLM Mapping

| Agent | Provider | Model | Purpose |
|---|---|---|---|
| Master | Z.AI | glm-5 | Final trading decisions |
| Debaters | Z.AI | glm-5 | Argumentation |
| Analyst | Z.AI | glm-4.7 | Sentiment analysis |
| Researcher | Groq | llama-3.3-70b | News summarization |
| Screener | Groq | llama-3.1-8b | Stock ranking |
| Executor | Groq | gpt-oss-120b | Position sizing |

## Market Phases

| Phase | IST | Dashboard Behavior |
|---|---|---|
| `closed` | 16:00-09:00 | Dim, "Market Closed" |
| `pre_market` | 09:00-09:15 | Yellow, research activity |
| `opening` | 09:15-09:30 | Green, screening + debates |
| `morning` | 09:30-12:00 | Full active, trades |
| `afternoon` | 12:00-14:00 | Active, re-screening |
| `closing` | 14:00-15:30 | Orange, winding down |
| `post_market` | 15:30-16:00 | Yellow, daily report |

## Data Refresh Strategy

| Data | Method | Interval |
|---|---|---|
| Status | React Query | 3s |
| Portfolio | React Query | 5s |
| Pending | React Query | 3s |
| Agents list | React Query | 5s |
| Signals | React Query | 10s |
| Timeline | React Query + WS | 10s + real-time |
| Config | React Query | 30s (rarely changes) |
| Watchlist | React Query | 10s |
| Quotes | React Query | 5s (when viewing) |
| Consensus | On demand | When user selects symbol |

## State Management

- **Server state**: React Query (polling + cache invalidation on mutations)
- **URL state**: `useSearchParams()` for filters, selected agent/symbol
- **UI state**: `useState` for tabs, expanded cards, modals
- No zustand needed — React Query + URL params covers it
