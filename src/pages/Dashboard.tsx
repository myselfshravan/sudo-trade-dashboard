import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SystemPulse } from "@/components/SystemPulse";
import { DebateArena } from "@/components/DebateArena";
import { Ledger } from "@/components/Ledger";
import { useStatus, useConsensus, useWebSocket } from "@/hooks/use-trading-data";

const Dashboard = () => {
  const { data: status } = useStatus();
  const { connected, events } = useWebSocket();
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [phaseFlash, setPhaseFlash] = useState(false);
  const { data: consensus } = useConsensus(selectedSymbol);

  const activeDebates = status?.active_debates || [];

  // Auto-select first debate
  useEffect(() => {
    if (!selectedSymbol && activeDebates.length > 0) {
      setSelectedSymbol(activeDebates[0]);
    }
  }, [activeDebates, selectedSymbol]);

  // Phase change flash
  useEffect(() => {
    const phaseEvent = events.find((e) => e.event === "schedule:phase_change");
    if (phaseEvent) {
      setPhaseFlash(true);
      setTimeout(() => setPhaseFlash(false), 200);
    }
  }, [events]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background relative">
      {/* Phase Flash Overlay */}
      <AnimatePresence>
        {phaseFlash && (
          <motion.div
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-accent/20 z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="h-8 border-b border-border flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] font-bold tracking-tighter text-foreground">
            SUDO_TRADE
          </span>
          <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
            SYSTEM_STATUS: {status?.master_state?.toUpperCase() || "—"} // MARKET_PHASE:{" "}
            {status?.phase?.toUpperCase() || "—"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-bull" : "bg-bear"}`} />
          <span className="font-mono text-[9px] text-muted-foreground">
            {connected ? "WS:LIVE" : "WS:DISCONNECTED"}
          </span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - System Pulse */}
        <SystemPulse />

        {/* Center - Arena */}
        <DebateArena
          consensus={consensus || null}
          activeDebates={activeDebates}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={setSelectedSymbol}
        />

        {/* Right Sidebar - Ledger */}
        <Ledger />
      </div>
    </div>
  );
};

export default Dashboard;
