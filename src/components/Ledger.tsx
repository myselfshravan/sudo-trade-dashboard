import { motion, AnimatePresence } from "framer-motion";
import { usePortfolio, usePending, useStatus } from "@/hooks/use-trading-data";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

export function Ledger() {
  const { data: portfolio } = usePortfolio();
  const { data: pendingData } = usePending();
  const { data: status } = useStatus();
  const queryClient = useQueryClient();
  const pending = pendingData?.pending || [];
  const cost = status?.cost;

  const handleApprove = async (idx: number) => {
    await api.approveTrade(idx);
    queryClient.invalidateQueries({ queryKey: ["pending"] });
    queryClient.invalidateQueries({ queryKey: ["portfolio"] });
  };

  const handleReject = async (idx: number) => {
    await api.rejectTrade(idx);
    queryClient.invalidateQueries({ queryKey: ["pending"] });
  };

  return (
    <div className="w-[320px] border-l border-border bg-background flex flex-col h-full overflow-hidden">
      {/* P&L Section */}
      <div className="px-3 py-3 border-b border-border">
        <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">PORTFOLIO</div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[18px] font-bold tracking-tighter text-foreground tabular-nums">
            {portfolio ? formatINR(portfolio.capital) : "—"}
          </span>
        </div>
        {portfolio && (
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground">P&L</span>
            <span
              className={`font-mono text-[13px] font-bold tabular-nums ${
                portfolio.pnl >= 0 ? "text-bull" : "text-bear"
              }`}
            >
              {portfolio.pnl >= 0 ? "+" : ""}
              {formatINR(portfolio.pnl)}
            </span>
          </div>
        )}
      </div>

      {/* Positions */}
      <div className="border-b border-border px-3 py-2">
        <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1.5">POSITIONS</div>
        {portfolio && Object.keys(portfolio.positions).length > 0 ? (
          <div className="space-y-1">
            {Object.entries(portfolio.positions).map(([symbol, pos]) => (
              <div key={symbol} className="flex items-center justify-between font-mono text-[12px]">
                <span className="text-foreground">{symbol}</span>
                <span className="text-muted-foreground tabular-nums">
                  {pos.qty} × {formatINR(pos.avg_price)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="font-mono text-[11px] text-muted-foreground">[NO_POSITIONS]</div>
        )}
      </div>

      {/* Pending Trades */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1.5">
          PENDING ({pending.length})
        </div>
        <AnimatePresence>
          {pending.map((signal, idx) => (
            <motion.div
              key={`${signal.symbol}-${idx}`}
              layout
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="border border-border rounded-sm p-2 mb-1.5 bg-surface"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[12px] font-bold text-foreground">{signal.symbol}</span>
                <span
                  className={`font-mono text-[10px] font-bold uppercase tracking-wider ${
                    signal.action === "buy" ? "text-bull" : "text-bear"
                  }`}
                >
                  {signal.action}
                </span>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground mb-1.5 tabular-nums">
                QTY: {signal.quantity} · CONF: {(signal.confidence * 100).toFixed(0)}% · {signal.style.toUpperCase()}
              </div>
              <p className="font-mono text-[10px] text-muted-foreground mb-2 leading-relaxed line-clamp-2">
                {signal.reasoning}
              </p>
              <div className="flex gap-1.5">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleApprove(idx)}
                  className="flex-1 font-mono text-[11px] font-bold uppercase tracking-widest bg-accent text-accent-foreground rounded-sm py-1 hover:bg-accent/90 transition-colors"
                >
                  APPROVE
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleReject(idx)}
                  className="flex-1 font-mono text-[11px] font-bold uppercase tracking-widest bg-muted text-muted-foreground rounded-sm py-1 hover:bg-muted/80 transition-colors"
                >
                  REJECT
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {pending.length === 0 && (
          <div className="font-mono text-[11px] text-muted-foreground">[NO_PENDING_TRADES]</div>
        )}
      </div>

      {/* LLM Cost */}
      {cost && (
        <div className="border-t border-border px-3 py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground">LLM COST</span>
            <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
              ${cost.total_cost_usd.toFixed(4)} / ${cost.daily_budget.toFixed(2)}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-sm overflow-hidden">
            <div
              className="h-full bg-accent rounded-sm transition-all"
              style={{ width: `${Math.min((cost.total_cost_usd / cost.daily_budget) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Recent Trades */}
      {portfolio && portfolio.trades.length > 0 && (
        <div className="border-t border-border px-3 py-2 max-h-[180px] overflow-y-auto">
          <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1.5">
            TRADE LOG ({portfolio.total_trades})
          </div>
          <div className="space-y-1">
            {portfolio.trades.slice(0, 10).map((trade) => (
              <div key={trade.order_id} className="flex items-center justify-between font-mono text-[10px]">
                <span className={trade.action === "BUY" ? "text-bull" : "text-bear"}>
                  {trade.action} {trade.symbol}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {trade.quantity} × {formatINR(trade.fill_price)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
