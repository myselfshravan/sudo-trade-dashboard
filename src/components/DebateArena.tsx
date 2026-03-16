import { motion, AnimatePresence } from "framer-motion";
import type { DebatePosition, ConsensusResult } from "@/lib/api";

interface DebateArenaProps {
  consensus: ConsensusResult | null;
  activeDebates: string[];
  selectedSymbol: string | null;
  onSelectSymbol: (s: string) => void;
}

function ConfidenceMeter({ bullScore, bearScore }: { bullScore: number; bearScore: number }) {
  const total = bullScore + bearScore || 1;
  const bullPct = (bullScore / total) * 100;

  return (
    <div className="w-8 flex flex-col items-center gap-1">
      <span className="font-mono text-[9px] text-bull tabular-nums">{bullScore.toFixed(1)}</span>
      <div className="flex-1 w-1.5 bg-muted rounded-sm overflow-hidden relative min-h-[100px]">
        <motion.div
          className="absolute bottom-0 w-full bg-bull rounded-sm"
          animate={{ height: `${bullPct}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>
      <span className="font-mono text-[9px] text-bear tabular-nums">{bearScore.toFixed(1)}</span>
    </div>
  );
}

function ArgumentCard({ position }: { position: DebatePosition }) {
  const isBull = position.stance === "bull";
  return (
    <motion.div
      initial={{ x: isBull ? -10 : 10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`border-l-2 ${isBull ? "border-bull" : "border-bear"} pl-3 py-2`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`font-mono text-[10px] font-bold uppercase tracking-wider ${isBull ? "text-bull" : "text-bear"}`}>
          {position.agent_name.replace(/_/g, " ")}
        </span>
        <span className="font-mono text-[9px] text-muted-foreground">
          R{position.round} · {(position.confidence * 100).toFixed(0)}%
        </span>
      </div>
      <p className="font-mono text-[13px] leading-relaxed text-foreground/90">
        {position.argument}
      </p>
      {position.evidence.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {position.evidence.map((e, i) => (
            <span key={i} className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground">
              {e}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function DebateArena({ consensus, activeDebates, selectedSymbol, onSelectSymbol }: DebateArenaProps) {
  if (!activeDebates.length && !consensus) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="font-mono text-[13px] text-muted-foreground">[NO_ACTIVE_DEBATES]</span>
      </div>
    );
  }

  const bullPositions = consensus?.positions.filter((p) => p.stance === "bull") || [];
  const bearPositions = consensus?.positions.filter((p) => p.stance === "bear") || [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Symbol Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border">
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground mr-2">
          ARENA
        </span>
        {activeDebates.map((s) => (
          <button
            key={s}
            onClick={() => onSelectSymbol(s)}
            className={`font-mono text-[11px] px-2 py-1 rounded-sm border transition-colors ${
              selectedSymbol === s
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Debate Content */}
      {consensus ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Bull Side */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="font-mono text-[10px] tracking-widest text-bull mb-2">BULL CASE</div>
            <AnimatePresence>
              {bullPositions.map((p, i) => (
                <ArgumentCard key={`bull-${i}`} position={p} />
              ))}
            </AnimatePresence>
            {bullPositions.length === 0 && (
              <span className="font-mono text-[11px] text-muted-foreground">[AWAITING_ARGUMENTS]</span>
            )}
          </div>

          {/* Confidence Meter */}
          <div className="flex items-center py-4">
            <ConfidenceMeter bullScore={consensus.bull_score} bearScore={consensus.bear_score} />
          </div>

          {/* Bear Side */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="font-mono text-[10px] tracking-widest text-bear mb-2">BEAR CASE</div>
            <AnimatePresence>
              {bearPositions.map((p, i) => (
                <ArgumentCard key={`bear-${i}`} position={p} />
              ))}
            </AnimatePresence>
            {bearPositions.length === 0 && (
              <span className="font-mono text-[11px] text-muted-foreground">[AWAITING_ARGUMENTS]</span>
            )}
          </div>
        </div>
      ) : selectedSymbol ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="font-mono text-[13px] text-muted-foreground">[LOADING_CONSENSUS: {selectedSymbol}]</span>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="font-mono text-[13px] text-muted-foreground">[SELECT_SYMBOL]</span>
        </div>
      )}

      {/* Verdict Bar */}
      {consensus && (
        <div className="px-4 py-2 border-t border-border flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground">VERDICT</span>
          <span
            className={`font-mono text-[12px] font-bold uppercase tracking-wider ${
              consensus.verdict.includes("buy") ? "text-bull" : consensus.verdict.includes("sell") ? "text-bear" : "text-muted-foreground"
            }`}
          >
            {consensus.verdict.replace("_", " ")}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {(consensus.confidence * 100).toFixed(0)}% CONF
          </span>
          <span className="font-mono text-[11px] text-muted-foreground flex-1 truncate">
            {consensus.reasoning}
          </span>
        </div>
      )}
    </div>
  );
}
