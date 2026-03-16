const phases = [
  "pre_market",
  "opening",
  "morning",
  "afternoon",
  "closing",
  "post_market",
  "closed",
];

const phaseLabels: Record<string, string> = {
  pre_market: "PRE",
  opening: "OPEN",
  morning: "MORN",
  afternoon: "AFTN",
  closing: "CLOS",
  post_market: "POST",
  closed: "CLSD",
};

interface MarketPhaseBarProps {
  currentPhase: string;
  marketOpen: boolean;
}

export function MarketPhaseBar({ currentPhase, marketOpen }: MarketPhaseBarProps) {
  const currentIdx = phases.indexOf(currentPhase);

  return (
    <div className="px-2 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Market Phase
        </span>
        <span
          className={`font-mono text-[10px] font-bold tracking-wider ${
            marketOpen ? "text-bull" : "text-bear"
          }`}
        >
          {marketOpen ? "OPEN" : "CLOSED"}
        </span>
      </div>
      <div className="flex gap-0.5">
        {phases.map((phase, idx) => (
          <div
            key={phase}
            className={`flex-1 h-1.5 rounded-sm transition-colors ${
              idx <= currentIdx
                ? idx === currentIdx
                  ? "bg-accent"
                  : "bg-accent/40"
                : "bg-muted"
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        {phases.map((phase, idx) => (
          <span
            key={phase}
            className={`font-mono text-[8px] ${
              idx === currentIdx ? "text-accent" : "text-muted-foreground"
            }`}
          >
            {phaseLabels[phase]}
          </span>
        ))}
      </div>
    </div>
  );
}
