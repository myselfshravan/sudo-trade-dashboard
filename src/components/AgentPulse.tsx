import { motion } from "framer-motion";
import type { AgentState } from "@/lib/api";

const stateColors: Record<string, string> = {
  running: "bg-bull",
  idle: "bg-muted-foreground",
  waiting: "bg-warning",
  error: "bg-bear",
  stopped: "bg-muted-foreground",
  rate_limited: "bg-warning",
};

const stateLabels: Record<string, string> = {
  running: "RUNNING",
  idle: "IDLE",
  waiting: "WAIT",
  error: "ERROR",
  stopped: "STOP",
  rate_limited: "RATE_LTD",
};

interface AgentPulseProps {
  name: string;
  agent: AgentState;
}

export function AgentPulse({ name, agent }: AgentPulseProps) {
  const isRunning = agent.state === "running";
  const dotColor = stateColors[agent.state] || "bg-muted-foreground";

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded-sm border border-border bg-surface ${
        isRunning ? "agent-running-glow" : agent.state === "error" ? "agent-error-glow" : ""
      }`}
    >
      <motion.div
        animate={isRunning ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
        transition={isRunning ? { duration: 2, repeat: Infinity } : {}}
        className={`h-2 w-2 rounded-full ${dotColor}`}
      />
      <span className="font-mono text-[11px] tracking-wider text-foreground uppercase flex-1">
        {name.replace(/_/g, " ")}
      </span>
      <span className="font-mono text-[10px] text-muted-foreground">
        {stateLabels[agent.state] || agent.state.toUpperCase()}
      </span>
    </div>
  );
}
