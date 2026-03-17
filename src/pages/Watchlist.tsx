import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWatchlist } from "@/hooks/use-trading-data";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export default function Watchlist() {
  const { data: watchlist } = useWatchlist();
  const queryClient = useQueryClient();
  const [newSymbol, setNewSymbol] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);

  const symbols = watchlist?.symbols || [];

  const handleAdd = async () => {
    const sym = newSymbol.trim().toUpperCase();
    if (!sym || symbols.includes(sym)) return;
    setSubmitting("add");
    await api.addToWatchlist(sym);
    queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    setNewSymbol("");
    setSubmitting(null);
  };

  const handleRemove = async (symbol: string) => {
    setSubmitting(symbol);
    await api.removeFromWatchlist(symbol);
    queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    setSubmitting(null);
  };

  const handleTask = async (type: string, syms: string[]) => {
    setSubmitting(type);
    await api.postTask(type, syms);
    setSubmitting(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-3 shrink-0">
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground">WATCHLIST</span>
        <span className="font-mono text-[12px] font-bold text-foreground tabular-nums">{symbols.length} symbols</span>
        <div className="ml-auto flex items-center gap-2">
          <input
            type="text"
            placeholder="Add symbol..."
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="font-mono text-[11px] bg-surface border border-border rounded-sm px-2 py-1 w-32 placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent"
          />
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleAdd}
            disabled={!newSymbol.trim()}
            className="font-mono text-[10px] font-bold tracking-widest bg-accent text-accent-foreground px-3 py-1 rounded-sm hover:bg-accent/90 transition-colors disabled:opacity-40"
          >
            ADD
          </motion.button>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="px-4 py-2 border-b border-border flex items-center gap-2 shrink-0">
        <span className="font-mono text-[9px] tracking-widest text-muted-foreground mr-2">ACTIONS</span>
        {[
          { label: "SCREEN ALL", type: "screen" },
          { label: "RESEARCH ALL", type: "research" },
          { label: "DEBATE ALL", type: "debate" },
          { label: "ANALYZE ALL", type: "analyze" },
        ].map((action) => (
          <motion.button
            key={action.type}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleTask(action.type, symbols)}
            disabled={symbols.length === 0 || submitting === action.type}
            className="font-mono text-[9px] font-bold tracking-widest bg-surface border border-border text-muted-foreground px-2 py-0.5 rounded-sm hover:text-foreground hover:border-muted-foreground/50 transition-colors disabled:opacity-40"
          >
            {submitting === action.type ? "..." : action.label}
          </motion.button>
        ))}
      </div>

      {/* Symbol Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence>
          {symbols.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {symbols.map((symbol) => (
                <motion.div
                  key={symbol}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="border border-border rounded-sm bg-surface p-3 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[14px] font-bold text-foreground">{symbol}</span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemove(symbol)}
                      disabled={submitting === symbol}
                      className="font-mono text-[9px] text-muted-foreground hover:text-bear transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {submitting === symbol ? "..." : "REMOVE"}
                    </motion.button>
                  </div>
                  <div className="flex gap-1">
                    {["screen", "debate", "analyze"].map((type) => (
                      <motion.button
                        key={type}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleTask(type, [symbol])}
                        className="font-mono text-[8px] tracking-widest bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm hover:text-foreground transition-colors uppercase"
                      >
                        {type}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="font-mono text-[13px] text-muted-foreground">[EMPTY_WATCHLIST]</span>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
