# sudo-trade-dashboard

Real-time dashboard UI for [sudo-trade](https://github.com/myselfshravan/sudo-trade) — AI-powered algorithmic trading system for Indian markets.

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

Capital, positions, realized P&L, trade history.

```json
{
  "capital": 500000.0,
  "positions": {
    "RELIANCE": { "qty": 10, "avg_price": 2850.50 }
  },
  "pnl": 1250.75,
  "trades": [
    {
      "order_id": "PAPER-A1B2C3D4",
      "symbol": "RELIANCE",
      "action": "BUY",
      "quantity": 10,
      "fill_price": 2850.50,
      "timestamp": "2026-03-16T14:30:45.123456",
      "capital_after": 471495.0
    }
  ],
  "total_trades": 5
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

Debate verdict for a specific stock.

```json
{
  "symbol": "RELIANCE",
  "verdict": "buy",
  "confidence": 0.85,
  "bull_score": 8.5,
  "bear_score": 2.0,
  "reasoning": "Bull case stronger on fundamentals",
  "positions": [
    {
      "agent_name": "debater_bull",
      "stance": "bull",
      "argument": "Strong fundamentals, positive momentum",
      "confidence": 0.90,
      "evidence": ["Q3 earnings beat", "Sector rotation bullish"],
      "round": 0
    }
  ]
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

Submit a task to the agent pipeline.

**Request:**
```json
{
  "type": "research|screen|debate|analyze",
  "symbols": ["RELIANCE", "TCS"]
}
```

**Response (202):**
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

**ConsensusResult**: `{symbol, verdict, confidence, bull_score, bear_score, reasoning, positions}`

---

### Error Responses

```json
{"error": "description"}
```

Status codes: `200` OK, `202` Accepted, `400` Bad Request, `404` Not Found

---

## Setup

```bash
# The engine must be running first
cd ../sudo-trade
uv run python -m src

# Then start the dashboard (port TBD)
cd dashboard
# ... UI setup here
```

## Architecture

```
sudo-trade (engine)        sudo-trade-dashboard (UI)
:8080 HTTP + WS  <-------->  :3000 (or wherever)
                    CORS
```

The engine handles all trading logic. The dashboard is a read-only view + trade approval interface.
