# sudo-trade-dashboard

Real-time dashboard UI for [sudo-trade](https://github.com/myselfshravan/sudo-trade) — AI-powered algorithmic trading system for Indian markets.

## Screenshots

![Dashboard — Debate Arena with bull/bear arguments and consensus](demo/screenshot_1.png)

![Dashboard — Detailed debate view with agent analysis](demo/screenshot_2.png)

## Proxy Config

Proxy `/api/*` to the engine. Example Next.js `next.config.js`:

```js
async rewrites() {
  return [
    { source: '/api/:path*', destination: 'http://localhost:8080/:path*' },
  ];
}
```

Or call `http://localhost:8080` directly — CORS is enabled on the engine.

---

## Operating Modes

### Autopilot (auto-execute)

Set `AGENT_AUTO_EXECUTE=true` in the engine's `.env`. The pipeline runs autonomously:

```
Research → Screen → Debate (bull vs bear) → Consensus → Analyze → Execute
```

Trades execute without human approval. Dashboard is a monitoring view — watch agents work, see trades execute, track P&L in real-time.

### Manual Mode (human-in-the-loop)

Set `AGENT_AUTO_EXECUTE=false`. Agents still research, screen, debate, and analyze — but trades queue for approval.

**UI controls for manual mode:**

| Action | Endpoint | Description |
|---|---|---|
| View pending trades | `GET /pending` | List signals awaiting approval |
| Approve a trade | `POST /trade/approve/{idx}` | Execute the trade at index |
| Reject a trade | `POST /trade/reject/{idx}` | Discard the signal |
| Trigger research | `POST /task` `{"type":"research"}` | Scan news/filings |
| Trigger screening | `POST /task` `{"type":"screen"}` | Find top stock picks |
| Trigger debate | `POST /task` `{"type":"debate","symbols":["RELIANCE"]}` | Start bull vs bear |
| Trigger analysis | `POST /task` `{"type":"analyze","symbols":["RELIANCE"]}` | Run sentiment analysis |

### Force Active Mode

Set `AGENT_FORCE_ACTIVE=true` to run outside market hours (weekends, holidays, after 3:30 PM). Useful for paper trading practice.

---

## Engine Configuration (`.env`)

| Variable | Default | Description |
|---|---|---|
| `AGENT_AUTO_EXECUTE` | `false` | Auto-execute trades or queue for approval |
| `AGENT_FORCE_ACTIVE` | `false` | Run outside market hours |
| `EXECUTION_INITIAL_CAPITAL` | `100000` | Starting paper capital (INR) |
| `AGENT_DAILY_BUDGET_USD` | `5.0` | Daily LLM spend limit |
| `API_HOST` | `0.0.0.0` | Engine API host |
| `API_PORT` | `8080` | Engine API port |
| `SUDO_TRADE_MODE` | `paper` | `paper` or `live` |

---

## Engine API

The dashboard consumes the trading engine HTTP API at `http://localhost:8080`.

### HTTP Endpoints

#### GET `/status`

Full system status — agent states, market phase, active debates, LLM cost.

```json
{
  "master_state": "idle",
  "phase": "morning",
  "market_open": true,
  "active_debates": ["RELIANCE", "TCS"],
  "agents": {
    "researcher": { "state": "running" },
    "screener": { "state": "idle" },
    "analyst": { "state": "idle" },
    "debater_bull": { "state": "running" },
    "debater_bear": { "state": "idle" },
    "executor_agent": { "state": "idle" }
  },
  "cost": {
    "daily_budget": 50.0,
    "total_cost_usd": 0.1234,
    "agents": {
      "master": { "tokens": 5000, "cost_usd": 0.075, "calls": 2 },
      "researcher": { "tokens": 3000, "cost_usd": 0.03, "calls": 1 }
    }
  }
}
```

Agent states: `idle` | `running` | `waiting` | `error` | `stopped` | `rate_limited`

Market phases: `pre_market` | `opening` | `morning` | `afternoon` | `closing` | `post_market` | `closed`

---

#### GET `/portfolio`

Capital, positions, realized P&L, trade history. State persists across engine restarts.

```json
{
  "capital": 1039921.18,
  "positions": {
    "LUPIN": { "qty": 122, "avg_price": 2289.07 }
  },
  "pnl": 566578.78,
  "trades": [
    {
      "order_id": "PAPER-A1B2C3D4",
      "symbol": "LUPIN",
      "action": "BUY",
      "quantity": 21,
      "fill_price": 2285.80,
      "timestamp": "2026-03-16T14:30:45.123456",
      "capital_after": 451998.20
    }
  ],
  "total_trades": 66
}
```

---

#### GET `/signals`

All current analysis signals keyed by symbol.

```json
{
  "signals:RELIANCE": [
    {
      "type": "sentiment",
      "source": "llm_sentiment",
      "symbol": "RELIANCE",
      "value": 0.75,
      "confidence": 0.85,
      "reasoning": "Positive sentiment from recent earnings",
      "timestamp": "2026-03-16T14:30:45.123456"
    }
  ]
}
```

Signal value range: `-1.0` (very bearish) to `1.0` (very bullish).

---

#### GET `/consensus/{symbol}`

Debate verdict for a specific stock. Contains full bull/bear argument history.

```json
{
  "symbol": "LUPIN",
  "verdict": "buy",
  "confidence": 0.72,
  "bull_score": 0.78,
  "bear_score": 0.48,
  "reasoning": "Bull case presents more specific, verifiable evidence...",
  "positions": [
    {
      "agent_name": "debater_bull",
      "stance": "bull",
      "argument": "Lupin presents a compelling turnaround...",
      "confidence": 0.78,
      "evidence": ["USFDA facility clearance", "Pipeline of 150+ ANDAs"],
      "rebuttal_to": "",
      "round": 0
    },
    {
      "agent_name": "debater_bear",
      "stance": "bear",
      "argument": "Persistent regulatory overhangs...",
      "confidence": 0.72,
      "evidence": ["FDA warning letters", "US pricing erosion 8-12%"],
      "rebuttal_to": "",
      "round": 0
    }
  ],
  "timestamp": "2026-03-16T15:28:29.450430"
}
```

Verdicts: `strong_buy` | `buy` | `hold` | `sell` | `strong_sell`

Returns `404` with `{"error": "no consensus for SYMBOL"}` if no debate completed.

---

#### GET `/pending`

Pending trade signals awaiting manual approval.

```json
{
  "pending": [
    {
      "action": "buy",
      "symbol": "RELIANCE",
      "quantity": 10,
      "confidence": 0.82,
      "reasoning": "Strong bull consensus with positive sentiment",
      "style": "intraday",
      "signals_used": [],
      "metadata": {}
    }
  ]
}
```

---

#### GET `/cost`

LLM cost tracking — per agent and daily total.

```json
{
  "daily_budget": 50.0,
  "total_cost_usd": 0.1234,
  "agents": {
    "master": { "tokens": 5000, "cost_usd": 0.075, "calls": 2 },
    "researcher": { "tokens": 3000, "cost_usd": 0.03, "calls": 1 }
  }
}
```

---

#### POST `/task`

Submit a task to the agent pipeline. Use from the UI to manually trigger work.

**Request:**
```json
{
  "type": "research|screen|debate|analyze",
  "symbols": ["RELIANCE", "TCS"]
}
```

| Type | What it does |
|---|---|
| `research` | Scan news, filings, social for symbols (or all if empty) |
| `screen` | Quantitative + LLM ranking to find top picks |
| `debate` | Start bull vs bear debate on given symbols |
| `analyze` | Run sentiment + technical analysis on symbols |

**Response (200):**
```json
{
  "status": "accepted",
  "task_id": "abc123def456"
}
```

---

#### POST `/trade/approve/{idx}`

Approve pending trade at index for execution.

**Response (200):** The approved trade signal object.

**Response (404):** `{"error": "no pending signal at index"}`

---

#### POST `/trade/reject/{idx}`

Reject pending trade at index.

**Response (200):** `{"status": "rejected", "symbol": "RELIANCE"}`

**Response (404):** `{"error": "no pending signal at index"}`

---

### WebSocket `/ws`

Real-time event stream. Connect to `ws://localhost:8080/ws`.

#### Events (server to client)

All events:
```json
{
  "event": "event_name",
  "data": {},
  "time": "2026-03-16T14:35:45.123456"
}
```

| Event | Data | Description |
|-------|------|-------------|
| `agent:research:complete` | `{symbols, findings}` | Research scan finished |
| `agent:screened` | `{symbols}` | Stock screening picks |
| `agent:debate:argument` | `{agent_name, stance, symbol, argument, confidence, evidence, round}` | Debate argument from bull/bear |
| `agent:debate:complete` | `{symbol, consensus}` | Debate concluded with verdict |
| `agent:analysis:complete` | `{symbols, signals}` | Analysis signals generated |
| `agent:trade:requested` | `{signal}` | Trade signal from master |
| `agent:trade:executed` | `{result}` | Trade executed (paper/live) |
| `agent:trade:pending` | `{signal, pending_count}` | Trade queued for approval |
| `schedule:phase_change` | `{phase, old_phase, time}` | Market phase transition |

#### Commands (client to server)

```json
{
  "type": "task",
  "task_type": "research|screen|debate|analyze",
  "symbols": ["RELIANCE"]
}
```

---

### Data Types

**TradeSignal**: `{action, symbol, quantity, confidence, reasoning, style, price_target, stop_loss, signals_used, metadata}`

Actions: `buy` | `sell` | `hold` | `short` | `cover`

**Trade**: `{order_id, symbol, action, quantity, fill_price, timestamp, capital_after}`

**Signal**: `{type, source, symbol, value, confidence, reasoning, timestamp}`

**ConsensusResult**: `{symbol, verdict, confidence, bull_score, bear_score, reasoning, positions, timestamp}`

---

### Error Responses

```json
{"error": "description"}
```

Status codes: `200` OK, `202` Accepted, `400` Bad Request, `404` Not Found

---

## Polling vs WebSocket

- **WebSocket** (`/ws`): real-time feeds — debates, trade executions, phase changes. Best for live activity panels.
- **HTTP polling**: state snapshots — `/status`, `/portfolio`, `/pending`, `/cost`. Poll every 5-10s.

Recommended: connect WebSocket on page load for live events, poll `/status` and `/portfolio` on intervals for state sync.

---

## Architecture

```
sudo-trade (engine)        sudo-trade-dashboard (UI)
:8080 HTTP + WS  <-------->  :3000
                    CORS
```

The engine handles all trading logic. The dashboard is a read-only view + trade approval interface.
