import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useConfig, useSaveConfig } from "@/hooks/use-trading-data";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { ConfigData, TradingMode } from "@/lib/api";

const TRADING_MODES: { value: TradingMode; label: string }[] = [
  { value: "equity_intraday", label: "Equity Intraday (MIS)" },
  { value: "equity_delivery", label: "Equity Delivery (CNC)" },
  { value: "fno", label: "F&O (NRML)" },
  { value: "all", label: "All Modes" },
];

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50">
      <span className="font-mono text-[12px] text-foreground">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors ${value ? "bg-bull" : "bg-muted"}`}
      >
        <motion.div
          animate={{ x: value ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 h-4 w-4 rounded-full bg-foreground"
        />
      </button>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50">
      <span className="font-mono text-[12px] text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="font-mono text-[12px] bg-surface border border-border rounded-sm px-2 py-1 w-24 text-right tabular-nums text-foreground focus:outline-none focus:border-accent"
        />
        {unit && <span className="font-mono text-[10px] text-muted-foreground w-6">{unit}</span>}
      </div>
    </div>
  );
}

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div className="py-3 border-b border-border/50">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[12px] text-foreground">{label}</span>
        <span className="font-mono text-[12px] text-accent tabular-nums">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-1.5 bg-muted rounded-sm appearance-none cursor-pointer accent-accent"
      />
      <div className="flex justify-between mt-0.5">
        <span className="font-mono text-[9px] text-muted-foreground">{min}</span>
        <span className="font-mono text-[9px] text-muted-foreground">{max}</span>
      </div>
    </div>
  );
}

export default function Settings() {
  const { data: config, isLoading } = useConfig();
  const saveConfig = useSaveConfig();
  const [draft, setDraft] = useState<Partial<ConfigData>>({});
  const [saved, setSaved] = useState(false);

  // Sync draft with server config
  useEffect(() => {
    if (config) {
      setDraft({
        TRADING_MODE: config.TRADING_MODE,
        AGENT_FORCE_ACTIVE: config.AGENT_FORCE_ACTIVE,
        AGENT_AUTO_EXECUTE: config.AGENT_AUTO_EXECUTE,
        AGENT_DEBATE_ROUNDS: config.AGENT_DEBATE_ROUNDS,
        AGENT_DAILY_BUDGET_USD: config.AGENT_DAILY_BUDGET_USD,
        AGENT_PER_AGENT_BUDGET_USD: config.AGENT_PER_AGENT_BUDGET_USD,
        AGENT_MASTER_BUDGET_USD: config.AGENT_MASTER_BUDGET_USD,
        AGENT_MIN_CONFIDENCE: config.AGENT_MIN_CONFIDENCE,
      });
    }
  }, [config]);

  const update = <K extends keyof ConfigData>(key: K, value: ConfigData[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    await saveConfig.mutateAsync(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Check if draft differs from config
  const hasChanges = config
    ? Object.entries(draft).some(([key, value]) => config[key as keyof ConfigData] !== value)
    : false;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="font-mono text-[13px] text-muted-foreground">[LOADING_CONFIG...]</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground">SETTINGS</span>
          <span className="font-mono text-[10px] text-muted-foreground ml-3">Runtime configuration</span>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="font-mono text-[10px] text-bull"
            >
              SAVED
            </motion.span>
          )}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleSave}
            disabled={!hasChanges || saveConfig.isPending}
            className="font-mono text-[10px] font-bold tracking-widest bg-accent text-accent-foreground px-4 py-1 rounded-sm hover:bg-accent/90 transition-colors disabled:opacity-40"
          >
            {saveConfig.isPending ? "SAVING..." : "SAVE"}
          </motion.button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          {/* Trading Controls */}
          <div>
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3">TRADING CONTROLS</div>
            <div className="border border-border rounded-sm bg-surface px-4">
              {/* Trading Mode */}
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <span className="font-mono text-[12px] text-foreground">Trading Mode</span>
                <select
                  value={(draft.TRADING_MODE as TradingMode) ?? "equity_intraday"}
                  onChange={(e) => update("TRADING_MODE", e.target.value as TradingMode)}
                  className="font-mono text-[11px] bg-background border border-border rounded-sm px-2 py-1 text-foreground focus:outline-none focus:border-accent"
                >
                  {TRADING_MODES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <Toggle
                label="Force Active (override market hours)"
                value={draft.AGENT_FORCE_ACTIVE as boolean ?? false}
                onChange={(v) => update("AGENT_FORCE_ACTIVE", v)}
              />
              <Toggle
                label="Auto Execute (skip trade approval)"
                value={draft.AGENT_AUTO_EXECUTE as boolean ?? false}
                onChange={(v) => update("AGENT_AUTO_EXECUTE", v)}
              />
            </div>
          </div>

          {/* Analysis Parameters */}
          <div>
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3">ANALYSIS PARAMETERS</div>
            <div className="border border-border rounded-sm bg-surface px-4">
              <NumberInput
                label="Debate Rounds"
                value={draft.AGENT_DEBATE_ROUNDS as number ?? 2}
                onChange={(v) => update("AGENT_DEBATE_ROUNDS", v)}
                min={1}
                max={5}
                step={1}
              />
              <SliderInput
                label="Min Confidence Threshold"
                value={draft.AGENT_MIN_CONFIDENCE as number ?? 0.6}
                onChange={(v) => update("AGENT_MIN_CONFIDENCE", v)}
                min={0}
                max={1}
                step={0.05}
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3">LLM BUDGET</div>
            <div className="border border-border rounded-sm bg-surface px-4">
              <NumberInput
                label="Daily Budget"
                value={draft.AGENT_DAILY_BUDGET_USD as number ?? 50}
                onChange={(v) => update("AGENT_DAILY_BUDGET_USD", v)}
                min={1}
                step={1}
                unit="$"
              />
              <NumberInput
                label="Per Agent Budget"
                value={draft.AGENT_PER_AGENT_BUDGET_USD as number ?? 10}
                onChange={(v) => update("AGENT_PER_AGENT_BUDGET_USD", v)}
                min={1}
                step={1}
                unit="$"
              />
              <NumberInput
                label="Master Agent Budget"
                value={draft.AGENT_MASTER_BUDGET_USD as number ?? 20}
                onChange={(v) => update("AGENT_MASTER_BUDGET_USD", v)}
                min={1}
                step={1}
                unit="$"
              />
            </div>
          </div>

          {/* Danger Zone */}
          <DangerZone />
        </div>
      </div>
    </div>
  );
}

function DangerZone() {
  const [resetCapital, setResetCapital] = useState(500000);
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const queryClient = useQueryClient();

  const handleReset = useCallback(async () => {
    setResetting(true);
    await api.resetSystem(resetCapital);
    queryClient.invalidateQueries();
    setResetting(false);
    setConfirming(false);
  }, [resetCapital, queryClient]);

  return (
    <div>
      <div className="font-mono text-[10px] tracking-widest text-bear mb-3">DANGER ZONE</div>
      <div className="border border-bear/30 rounded-sm bg-bear/5 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[12px] font-bold text-foreground">Hard Reset</div>
            <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
              Flush all positions, trades, P&L, agent memories, and shared state. Start fresh.
            </div>
          </div>
          {!confirming ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setConfirming(true)}
              className="font-mono text-[10px] font-bold tracking-widest bg-bear/10 text-bear border border-bear/30 px-4 py-1 rounded-sm hover:bg-bear/20 transition-colors"
            >
              RESET
            </motion.button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="font-mono text-[9px] text-muted-foreground">Capital:</span>
                <input
                  type="number"
                  value={resetCapital}
                  onChange={(e) => setResetCapital(Number(e.target.value))}
                  className="font-mono text-[11px] bg-background border border-border rounded-sm px-2 py-0.5 w-28 text-right tabular-nums text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleReset}
                disabled={resetting}
                className="font-mono text-[10px] font-bold tracking-widest bg-bear text-white px-3 py-1 rounded-sm hover:bg-bear/90 transition-colors disabled:opacity-50"
              >
                {resetting ? "RESETTING..." : "CONFIRM RESET"}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setConfirming(false)}
                className="font-mono text-[10px] tracking-widest text-muted-foreground px-2 py-1 hover:text-foreground transition-colors"
              >
                CANCEL
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
