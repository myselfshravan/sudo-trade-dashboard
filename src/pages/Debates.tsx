import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTimeline, useConsensus, useStatus } from "@/hooks/use-trading-data";
import type { DebatePosition } from "@/lib/api";

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
      <p className="font-mono text-[13px] leading-relaxed text-foreground/90">{position.argument}</p>
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

export default function Debates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSymbol = searchParams.get("symbol");
  const { data: status } = useStatus();
  const { data: timeline } = useTimeline({ type: "agent:debate:complete", limit: 50 });
  const { data: consensus } = useConsensus(selectedSymbol);

  // Extract debated symbols from timeline
  const debatedSymbols = Array.from(
    new Set([
      ...(status?.active_debates || []),
      ...(timeline?.map((e) => e.data?.symbol as string).filter(Boolean) || []),
    ])
  );

  // Auto-select first if none selected
  useEffect(() => {
    if (!selectedSymbol && debatedSymbols.length > 0) {
      setSearchParams({ symbol: debatedSymbols[0] }, { replace: true });
    }
  }, [debatedSymbols.length, selectedSymbol, setSearchParams]);

  const selectSymbol = (s: string) => setSearchParams({ symbol: s });

  const bullPositions = consensus?.positions.filter((p) => p.stance === "bull") || [];
  const bearPositions = consensus?.positions.filter((p) => p.stance === "bear") || [];

  const isActive = status?.active_debates?.includes(selectedSymbol || "") ?? false;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Symbol List */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border overflow-x-auto shrink-0">
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground mr-2">DEBATES</span>
        {debatedSymbols.map((s) => (
          <button
            key={s}
            onClick={() => selectSymbol(s)}
            className={`font-mono text-[11px] px-2 py-1 rounded-sm border transition-colors shrink-0 ${
              selectedSymbol === s
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
            {status?.active_debates?.includes(s) && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-bull animate-pulse" />
            )}
          </button>
        ))}
        {debatedSymbols.length === 0 && (
          <span className="font-mono text-[11px] text-muted-foreground">[NO_DEBATES_YET]</span>
        )}
      </div>

      {/* Verdict Bar */}
      {consensus && (
        <div className="px-4 py-2 border-b border-border flex items-center gap-3 shrink-0 bg-surface">
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground">VERDICT</span>
          <span
            className={`font-mono text-[14px] font-bold uppercase tracking-wider ${
              consensus.verdict.includes("buy") ? "text-bull" : consensus.verdict.includes("sell") ? "text-bear" : "text-muted-foreground"
            }`}
          >
            {consensus.verdict.replace("_", " ")}
          </span>
          <span className="font-mono text-[12px] text-muted-foreground tabular-nums">
            {(consensus.confidence * 100).toFixed(0)}% CONF
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <span className="font-mono text-[11px] text-bull tabular-nums">BULL: {consensus.bull_score.toFixed(2)}</span>
            <span className="font-mono text-[11px] text-muted-foreground">|</span>
            <span className="font-mono text-[11px] text-bear tabular-nums">BEAR: {consensus.bear_score.toFixed(2)}</span>
          </div>
          {isActive && (
            <span className="font-mono text-[9px] tracking-widest px-2 py-0.5 rounded-sm bg-bull/10 text-bull">LIVE</span>
          )}
        </div>
      )}

      {/* Debate Content */}
      {consensus ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Bull Side */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 border-r border-border">
            <div className="font-mono text-[10px] tracking-widest text-bull mb-2">
              BULL CASE ({bullPositions.length} arguments)
            </div>
            <AnimatePresence>
              {bullPositions.map((p, i) => (
                <ArgumentCard key={`bull-${i}`} position={p} />
              ))}
            </AnimatePresence>
            {bullPositions.length === 0 && (
              <span className="font-mono text-[11px] text-muted-foreground">[AWAITING_ARGUMENTS]</span>
            )}
          </div>

          {/* Bear Side */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="font-mono text-[10px] tracking-widest text-bear mb-2">
              BEAR CASE ({bearPositions.length} arguments)
            </div>
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

      {/* Reasoning */}
      {consensus?.reasoning && (
        <div className="px-4 py-2 border-t border-border shrink-0">
          <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">REASONING</div>
          <p className="font-mono text-[12px] text-foreground/80 leading-relaxed">{consensus.reasoning}</p>
        </div>
      )}
    </div>
  );
}
