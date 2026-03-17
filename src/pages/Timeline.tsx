import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTimeline, useWebSocket } from "@/hooks/use-trading-data";

const EVENT_TYPES = [
  { value: "", label: "ALL" },
  { value: "agent:research:complete", label: "RESEARCH" },
  { value: "agent:screened", label: "SCREEN" },
  { value: "agent:debate:argument", label: "DEBATE ARG" },
  { value: "agent:debate:complete", label: "DEBATE END" },
  { value: "agent:analysis:complete", label: "ANALYSIS" },
  { value: "agent:trade:requested", label: "TRADE REQ" },
  { value: "agent:trade:executed", label: "TRADE EXEC" },
  { value: "agent:trade:pending", label: "TRADE PEND" },
  { value: "schedule:phase_change", label: "PHASE" },
];

const eventColors: Record<string, string> = {
  "agent:research:complete": "text-accent",
  "agent:screened": "text-accent",
  "agent:debate:argument": "text-warning",
  "agent:debate:complete": "text-warning",
  "agent:analysis:complete": "text-accent",
  "agent:trade:requested": "text-bull",
  "agent:trade:executed": "text-bull",
  "agent:trade:pending": "text-muted-foreground",
  "schedule:phase_change": "text-foreground",
};

export default function Timeline() {
  const [searchParams, setSearchParams] = useSearchParams();
  const typeFilter = searchParams.get("type") || "";
  const fromFilter = searchParams.get("from") || "";
  const toFilter = searchParams.get("to") || "";
  const limit = parseInt(searchParams.get("limit") || "100", 10);

  const { data: timeline } = useTimeline({
    type: typeFilter || undefined,
    from: fromFilter || undefined,
    to: toFilter || undefined,
    limit,
  });

  const { events: wsEvents, connected } = useWebSocket();

  // Merge WS events (live) with historical timeline
  const liveEvents = typeFilter
    ? wsEvents.filter((e) => e.event === typeFilter)
    : wsEvents;

  const historicalEvents = timeline || [];

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Filters */}
      <div className="px-4 py-2 border-b border-border flex items-center gap-3 shrink-0">
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground">TIMELINE</span>

        <select
          value={typeFilter}
          onChange={(e) => updateFilter("type", e.target.value)}
          className="font-mono text-[10px] bg-surface border border-border rounded-sm px-2 py-1 text-foreground focus:outline-none focus:border-accent"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <input
          type="datetime-local"
          value={fromFilter}
          onChange={(e) => updateFilter("from", e.target.value)}
          className="font-mono text-[10px] bg-surface border border-border rounded-sm px-2 py-1 text-foreground focus:outline-none focus:border-accent"
          placeholder="From"
        />
        <input
          type="datetime-local"
          value={toFilter}
          onChange={(e) => updateFilter("to", e.target.value)}
          className="font-mono text-[10px] bg-surface border border-border rounded-sm px-2 py-1 text-foreground focus:outline-none focus:border-accent"
          placeholder="To"
        />

        <div className="ml-auto flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-bull animate-pulse" : "bg-bear"}`} />
          <span className="font-mono text-[9px] text-muted-foreground">
            {connected ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Event List */}
      <div className="flex-1 overflow-y-auto">
        {/* Live events section */}
        {liveEvents.length > 0 && (
          <div className="border-b border-accent/20">
            <div className="px-4 py-1 bg-accent/5">
              <span className="font-mono text-[9px] tracking-widest text-accent">LIVE ({liveEvents.length})</span>
            </div>
            <AnimatePresence>
              {liveEvents.map((event, i) => (
                <motion.div
                  key={`live-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="px-4 py-1.5 border-b border-border/30 flex items-start gap-3 hover:bg-surface transition-colors"
                >
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums w-[70px] shrink-0">
                    {new Date(event.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span className={`font-mono text-[10px] tracking-wider w-[180px] shrink-0 ${eventColors[event.event] || "text-muted-foreground"}`}>
                    {event.event}
                  </span>
                  <span className="font-mono text-[10px] text-foreground/70 truncate">
                    {JSON.stringify(event.data)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Historical events */}
        <div>
          {historicalEvents.length > 0 && (
            <div className="px-4 py-1 bg-surface">
              <span className="font-mono text-[9px] tracking-widest text-muted-foreground">
                HISTORY ({historicalEvents.length})
              </span>
            </div>
          )}
          {historicalEvents.map((event, i) => (
            <div
              key={`hist-${i}`}
              className="px-4 py-1.5 border-b border-border/30 flex items-start gap-3 hover:bg-surface transition-colors"
            >
              <span className="font-mono text-[10px] text-muted-foreground tabular-nums w-[70px] shrink-0">
                {new Date(event.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              <span className={`font-mono text-[10px] tracking-wider w-[180px] shrink-0 ${eventColors[event.event] || "text-muted-foreground"}`}>
                {event.event}
              </span>
              <span className="font-mono text-[10px] text-foreground/70 truncate">
                {JSON.stringify(event.data)}
              </span>
            </div>
          ))}
          {historicalEvents.length === 0 && liveEvents.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <span className="font-mono text-[13px] text-muted-foreground">[NO_EVENTS]</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
