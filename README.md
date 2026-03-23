<div align="center">

# sudo-trade dashboard

**Real-time command center for an AI-powered trading system**

Watch autonomous agents research, debate, and trade Indian markets — live.

[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion)

`6 AI Agents` | `Real-time WebSocket` | `Live P&L Tracking` | `Bull vs Bear Debates` | `NSE/BSE Markets`

</div>

---

![Dashboard — AI agents debating bull vs bear case with live consensus scoring](demo/screenshot_1.png)

![Dashboard — Full debate view with agent arguments, evidence, and verdict](demo/screenshot_2.png)

---

## How It Works

```mermaid
graph LR
    A[News & Filings] -->|scan| B(Research Agent)
    B -->|findings| C(Screener Agent)
    C -->|top picks| D{Debate Arena}
    D -->|bull case| E[Bull Agent]
    D -->|bear case| F[Bear Agent]
    E -->|arguments| G(Consensus Judge)
    F -->|arguments| G
    G -->|verdict| H(Analyst Agent)
    H -->|signals| I(Executor Agent)
    I -->|trade| J[Paper / Live Broker]

    style D fill:#1e293b,stroke:#f59e0b,color:#f59e0b
    style G fill:#1e293b,stroke:#10b981,color:#10b981
    style J fill:#1e293b,stroke:#3b82f6,color:#3b82f6
```

> Every step in this pipeline is visible in the dashboard in real-time. The agents run autonomously during market hours — you just watch (or approve trades manually).

---

## Backtesting Results

Stress-tested over 10 days of high-volatility sessions during the India-Pakistan conflict escalation (March 2026). Markets swung wildly — the kind of environment that breaks most strategies.

```mermaid
graph TD
    subgraph Performance["Backtest Performance (March 2026)"]
        direction LR
        A["Starting Capital<br/><b>₹10,00,000</b>"] --> B["Current Value<br/><b>₹23,66,000+</b>"]
        B --> C["Realized P&L<br/><b>+₹7,66,000</b>"]
    end

    subgraph Stats["Key Metrics"]
        direction LR
        D["148 Trades"] --- E["11% Win Rate"]
        E --- F["11 Positions Held"]
    end

    style Performance fill:#0f172a,stroke:#10b981,color:#e2e8f0
    style Stats fill:#0f172a,stroke:#3b82f6,color:#e2e8f0
    style B fill:#0f172a,stroke:#10b981,color:#10b981
    style C fill:#0f172a,stroke:#10b981,color:#10b981
```

> The system identified high-conviction entries during panic selling and timed exits on relief rallies. Bull vs bear debate mechanism proved especially valuable — forced the system to argue both sides before committing capital during uncertain geopolitical conditions.

---

## Pages

### Overview
Real-time debate arena with system pulse sidebar, live bull vs bear arguments, consensus verdicts, and trade ledger — the main command center during market hours.

### Portfolio
Capital summary cards (P&L, positions value, total trades, win rate), current holdings with quick close buttons, full trade log with symbol/action/price filtering, and LLM cost meter showing daily budget usage.

### Debates
Detailed debate transcripts — browse all debated stocks via symbol tabs, see verdict bar (BUY/SELL/HOLD with confidence %), bull and bear arguments with round numbers, evidence tags, and final consensus reasoning.

### Agents
Multi-agent inspection dashboard — live state indicators per agent (running, idle, error), LLM cost per agent (USD, tokens, calls), pause/resume controls, session state with conversation history, and time-series event logs.

### Watchlist
Custom stock tracking — add symbols, run batch actions (SCREEN ALL, RESEARCH ALL, DEBATE ALL, ANALYZE ALL), per-symbol action buttons on hover, draggable card grid.

### Timeline
Event stream with live WebSocket updates and historical replay — filter by event type (research, debate, trades, phase changes) and date range, color-coded event types with raw JSON payloads.

### Settings
Runtime configuration — trading mode (intraday/delivery/F&O), force active toggle, auto execute toggle, debate rounds, confidence threshold slider, LLM budget controls, and hard reset with confirmation dialog.

---

## Demo Screenshots

<details>
<summary><b>Debates — Bull vs Bear AI Arguments</b></summary>
<br/>

![Debates — Full debate view with bull vs bear arguments, evidence, and consensus verdict](demo/DEBATES_DEMO_SCREENSHOT.png)

</details>

<details>
<summary><b>Agents — Live Agent States & Activity</b></summary>
<br/>

![Agents — Agent profiles, session history, and real-time status monitoring](demo/AGENTS_DEMO_SCREENSHOT.png)

</details>

<details>
<summary><b>Portfolio — Positions, Trades & P&L</b></summary>
<br/>

![Portfolio — Capital, positions, trade log, and realized P&L tracking](demo/PORTFOLIO_DEMO_SCREENSHOT.png)

</details>

<details>
<summary><b>Timeline — Event Stream</b></summary>
<br/>

![Timeline — Chronological event log of all agent actions and system events](demo/TIMELINE_DEMO_SCREENSHOT.png)

</details>

<details>
<summary><b>Settings — Runtime Configuration</b></summary>
<br/>

![Settings — Trading controls, analysis parameters, and LLM budget configuration](demo/SETTINGS_CONFIG_SCREENSHOT.png)

</details>

---

## Architecture

```mermaid
graph TB
    subgraph Engine["sudo-trade engine (private)"]
        direction TB
        M[Master Agent] --> R[Researcher]
        M --> S[Screener]
        M --> DB[Debater Bull]
        M --> DBR[Debater Bear]
        M --> AN[Analyst]
        M --> EX[Executor]
        API[":8080 HTTP + WebSocket"]
    end

    subgraph Dashboard["sudo-trade-dashboard (this repo)"]
        direction TB
        RC[React + TypeScript]
        TW[Tailwind + shadcn/ui]
        FM[Framer Motion]
        TQ[TanStack Query]
        WS[WebSocket Client]
    end

    API <-->|CORS / Vite Proxy| WS

    style Engine fill:#0f172a,stroke:#f59e0b,color:#e2e8f0
    style Dashboard fill:#0f172a,stroke:#3b82f6,color:#e2e8f0
    style API fill:#1e293b,stroke:#10b981,color:#10b981
```

The engine handles all intelligence. The dashboard is a real-time observer + trade approval interface.

---

## Market Phases

The system follows NSE trading hours with phase-based agent scheduling:

```mermaid
gantt
    title Daily Trading Schedule (IST)
    dateFormat HH:mm
    axisFormat %H:%M

    section Phases
    Pre-Market (Research)        :active, 09:00, 09:15
    Opening (Screen & Debate)    :active, 09:15, 09:30
    Morning (Execute & Monitor)  :crit,   09:30, 12:00
    Afternoon (Re-evaluate)      :active, 12:00, 14:00
    Closing (Exit Intraday)      :crit,   14:00, 15:30
    Post-Market (Daily Summary)  :active, 15:30, 16:00
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | React 18, TypeScript 5.8 |
| Build | Vite 5 |
| Styling | Tailwind CSS 3.4, shadcn/ui (35+ Radix primitives) |
| Animations | Framer Motion 12 |
| Data | TanStack Query 5, native WebSocket |
| Charts | Recharts 2 |
| Icons | Lucide React |
| Testing | Vitest, Playwright, Testing Library |

---

## Operating Modes

| Mode | Config | Dashboard Behavior |
|---|---|---|
| **Autopilot** | `AGENT_AUTO_EXECUTE=true` | Pure monitoring — watch agents trade autonomously |
| **Manual** | `AGENT_AUTO_EXECUTE=false` | Approve/reject trades from the Ledger panel |
| **Force Active** | `AGENT_FORCE_ACTIVE=true` | Run outside market hours (weekends, holidays) |

---

## Setup

```bash
# Clone
git clone https://github.com/myselfshravan/sudo-trade-dashboard.git
cd sudo-trade-dashboard

# Install
bun install   # or npm install

# Dev server (port 3001)
bun dev       # or npm run dev
```

Set `VITE_API_URL` in `.env` to point to your engine instance, or the Vite proxy will route `/api/*` to the configured target.

---

<details>
<summary><h2>Engine API Reference</h2></summary>

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

| Type | What it does |
|---|---|
| `research` | Scan news, filings, social for symbols |
| `screen` | Quantitative + LLM ranking to find top picks |
| `debate` | Start bull vs bear debate on given symbols |
| `analyze` | Run sentiment + technical analysis on symbols |

**Response:**
```json
{
  "status": "accepted",
  "task_id": "abc123def456"
}
```

---

#### POST `/trade/approve/{idx}`

Approve pending trade at index for execution.

#### POST `/trade/reject/{idx}`

Reject pending trade at index.

---

### WebSocket `/ws`

Real-time event stream. Connect to `ws://localhost:8080/ws`.

All events follow this shape:
```json
{
  "event": "event_name",
  "data": {},
  "time": "2026-03-16T14:35:45.123456"
}
```

| Event | Data | Description |
|---|---|---|
| `agent:research:complete` | `{symbols, findings}` | Research scan finished |
| `agent:screened` | `{symbols}` | Stock screening picks |
| `agent:debate:argument` | `{agent_name, stance, symbol, argument, confidence, evidence, round}` | Debate argument |
| `agent:debate:complete` | `{symbol, consensus}` | Debate concluded with verdict |
| `agent:analysis:complete` | `{symbols, signals}` | Analysis signals generated |
| `agent:trade:requested` | `{signal}` | Trade signal from master |
| `agent:trade:executed` | `{result}` | Trade executed |
| `agent:trade:pending` | `{signal, pending_count}` | Trade queued for approval |
| `schedule:phase_change` | `{phase, old_phase, time}` | Market phase transition |

</details>

---

<div align="center">

Built for [sudo-trade](https://github.com/myselfshravan/sudo-trade)

</div>
