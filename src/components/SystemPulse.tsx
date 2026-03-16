import { useStatus } from "@/hooks/use-trading-data";
import { AgentPulse } from "./AgentPulse";
import { MarketPhaseBar } from "./MarketPhaseBar";

export function SystemPulse() {
  const { data: status } = useStatus();

  return (
    <div className="w-[240px] border-r border-border bg-background flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border">
        <div className="font-mono text-[10px] tracking-widest text-muted-foreground">SYSTEM</div>
        <div className="font-mono text-[13px] font-bold tracking-tighter text-foreground">
          {status?.master_state === "idle" ? "OPERATIONAL" : status?.master_state?.toUpperCase() || "—"}
        </div>
      </div>

      {/* Market Phase */}
      <div className="border-b border-border">
        <MarketPhaseBar
          currentPhase={status?.phase || "closed"}
          marketOpen={status?.market_open ?? false}
        />
      </div>

      {/* Agent Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-2 px-1">
          AGENTS
        </div>
        <div className="space-y-1">
          {status?.agents ? (
            Object.entries(status.agents).map(([name, agent]) => (
              <AgentPulse key={name} name={name} agent={agent} />
            ))
          ) : (
            <div className="font-mono text-[11px] text-muted-foreground px-1">
              [CONNECTING...]
            </div>
          )}
        </div>
      </div>

      {/* Active Debates */}
      {status?.active_debates && status.active_debates.length > 0 && (
        <div className="border-t border-border p-2">
          <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1.5 px-1">
            ACTIVE DEBATES
          </div>
          <div className="flex flex-wrap gap-1 px-1">
            {status.active_debates.map((symbol) => (
              <span
                key={symbol}
                className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-accent/10 text-accent border border-accent/20"
              >
                {symbol}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
