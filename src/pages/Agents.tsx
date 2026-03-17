import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAgents, useAgentProfile, useAgentSession, useAgentHistory, useStatus } from "@/hooks/use-trading-data";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

const stateColors: Record<string, string> = {
  running: "bg-bull",
  idle: "bg-muted-foreground",
  waiting: "bg-warning",
  paused: "bg-accent",
  error: "bg-bear",
  stopped: "bg-muted-foreground",
  rate_limited: "bg-warning",
};

export default function Agents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAgent = searchParams.get("name");
  const { data: agents } = useAgents();
  const { data: status } = useStatus();
  const { data: profile } = useAgentProfile(selectedAgent);
  const { data: session } = useAgentSession(selectedAgent);
  const { data: history } = useAgentHistory(selectedAgent, { limit: 20 });
  const queryClient = useQueryClient();
  const cost = status?.cost;

  const handlePauseResume = async (name: string, currentState: string) => {
    if (currentState === "paused") {
      await api.resumeAgent(name);
    } else {
      await api.pauseAgent(name);
    }
    queryClient.invalidateQueries({ queryKey: ["agents"] });
    queryClient.invalidateQueries({ queryKey: ["status"] });
  };

  const selectAgent = (name: string) => setSearchParams({ name });

  return (
    <div className="h-full flex overflow-hidden">
      {/* Agent Grid */}
      <div className="w-[320px] border-r border-border flex flex-col overflow-hidden">
        <div className="px-4 py-2 border-b border-border">
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground">AGENTS</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {agents ? (
            Object.entries(agents).map(([name, agent]) => {
              const agentCost = cost?.agents?.[name];
              return (
                <motion.button
                  key={name}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectAgent(name)}
                  className={`w-full text-left px-3 py-2.5 rounded-sm border transition-colors ${
                    selectedAgent === name
                      ? "border-accent bg-accent/10"
                      : "border-border bg-surface hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-2 w-2 rounded-full ${stateColors[agent.state] || "bg-muted-foreground"}`} />
                    <span className="font-mono text-[12px] font-bold text-foreground uppercase tracking-wider flex-1">
                      {name.replace(/_/g, " ")}
                    </span>
                    <span className="font-mono text-[9px] text-muted-foreground uppercase">
                      {agent.state}
                    </span>
                  </div>
                  {agentCost && (
                    <div className="font-mono text-[9px] text-muted-foreground tabular-nums pl-4">
                      ${agentCost.cost_usd.toFixed(4)} · {agentCost.calls} calls · {agentCost.tokens.toLocaleString()} tok
                    </div>
                  )}
                </motion.button>
              );
            })
          ) : (
            <div className="font-mono text-[11px] text-muted-foreground px-3">[CONNECTING...]</div>
          )}
        </div>
      </div>

      {/* Agent Detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedAgent ? (
          <>
            {/* Agent Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <div className="font-mono text-[14px] font-bold text-foreground uppercase tracking-wider">
                  {selectedAgent.replace(/_/g, " ")}
                </div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  State: {agents?.[selectedAgent]?.state?.toUpperCase() || "—"}
                </div>
              </div>
              {agents?.[selectedAgent] && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handlePauseResume(selectedAgent, agents[selectedAgent].state)}
                  className={`font-mono text-[10px] font-bold tracking-widest px-3 py-1 rounded-sm border transition-colors ${
                    agents[selectedAgent].state === "paused"
                      ? "border-bull bg-bull/10 text-bull"
                      : "border-warning bg-warning/10 text-warning"
                  }`}
                >
                  {agents[selectedAgent].state === "paused" ? "RESUME" : "PAUSE"}
                </motion.button>
              )}
            </div>

            {/* Tabs Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Profile (L0) */}
              <div className="border-b border-border px-4 py-3">
                <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-2">PROFILE (L0)</div>
                {profile ? (
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(profile).map(([key, value]) => (
                      <div key={key} className="bg-surface border border-border rounded-sm px-3 py-2">
                        <div className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase">
                          {key.replace(/_/g, " ")}
                        </div>
                        <div className="font-mono text-[14px] font-bold tabular-nums text-foreground">
                          {typeof value === "number" ? value.toLocaleString() : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="font-mono text-[11px] text-muted-foreground">[NO_PROFILE]</span>
                )}
              </div>

              {/* Session (L1) */}
              <div className="border-b border-border px-4 py-3">
                <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-2">
                  SESSION (L1) — {session?.message_count ?? 0} messages
                </div>
                {session?.facts && Object.keys(session.facts).length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {Object.entries(session.facts).map(([key, value]) => (
                      <span key={key} className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground">
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                )}
                {session?.messages && session.messages.length > 0 ? (
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {session.messages.slice(-5).map((msg, i) => (
                      <div key={i} className="font-mono text-[11px] text-foreground/80">
                        <span className="text-accent font-bold">{msg.role}:</span>{" "}
                        <span className="line-clamp-2">{msg.content}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="font-mono text-[11px] text-muted-foreground">[NO_SESSION]</span>
                )}
              </div>

              {/* History (L2) */}
              <div className="px-4 py-3">
                <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-2">HISTORY (L2)</div>
                {history && history.length > 0 ? (
                  <div className="space-y-1">
                    {history.map((entry, i) => (
                      <div key={i} className="flex items-center gap-2 font-mono text-[11px] py-1 border-b border-border/30">
                        <span className="text-muted-foreground tabular-nums w-[60px] shrink-0">
                          {new Date(entry.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="text-accent text-[10px] tracking-wider uppercase shrink-0">{entry.type}</span>
                        {entry.symbol && <span className="text-foreground font-bold">{entry.symbol}</span>}
                        {entry.confidence != null && (
                          <span className="text-muted-foreground tabular-nums ml-auto">
                            {(entry.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="font-mono text-[11px] text-muted-foreground">[NO_HISTORY]</span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <span className="font-mono text-[13px] text-muted-foreground">[SELECT_AGENT]</span>
          </div>
        )}
      </div>
    </div>
  );
}
