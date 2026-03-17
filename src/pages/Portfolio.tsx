import { motion, AnimatePresence } from "framer-motion";
import { usePortfolio, useStatus } from "@/hooks/use-trading-data";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

export default function Portfolio() {
  const { data: portfolio } = usePortfolio();
  const { data: status } = useStatus();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<{ symbol: string; action: string }>({ symbol: "", action: "" });
  const cost = status?.cost;

  const handleClose = async (symbol: string) => {
    await api.closePosition(symbol);
    queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    queryClient.invalidateQueries({ queryKey: ["pending"] });
  };

  const trades = portfolio?.trades || [];
  const filteredTrades = trades.filter((t) => {
    if (filter.symbol && !t.symbol.toLowerCase().includes(filter.symbol.toLowerCase())) return false;
    if (filter.action && t.action.toLowerCase() !== filter.action.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Summary Cards */}
      <div className="grid grid-cols-6 gap-px border-b border-border bg-border">
        {[
          { label: "CAPITAL", value: portfolio ? formatINR(portfolio.capital) : "—" },
          {
            label: "TOTAL P&L",
            value: portfolio ? `${portfolio.pnl >= 0 ? "+" : ""}${formatINR(portfolio.pnl)} (${portfolio.pnl_pct >= 0 ? "+" : ""}${portfolio.pnl_pct}%)` : "—",
            color: portfolio ? (portfolio.pnl >= 0 ? "text-bull" : "text-bear") : "",
          },
          { label: "POSITIONS VALUE", value: portfolio ? formatINR(portfolio.positions_value) : "—" },
          { label: "TOTAL VALUE", value: portfolio ? formatINR(portfolio.total_value) : "—" },
          { label: "TOTAL TRADES", value: portfolio ? String(portfolio.total_trades) : "—" },
          { label: "WIN RATE", value: portfolio ? `${portfolio.win_rate}%` : "—" },
        ].map((card) => (
          <div key={card.label} className="bg-background px-4 py-3">
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground">{card.label}</div>
            <div className={`font-mono text-[18px] font-bold tracking-tighter tabular-nums ${card.color || "text-foreground"}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Positions Panel */}
        <div className="w-[360px] border-r border-border flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-border">
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground">POSITIONS</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {portfolio && Object.keys(portfolio.positions).length > 0 ? (
              <div className="divide-y divide-border">
                {Object.entries(portfolio.positions).map(([symbol, pos]) => (
                  <div key={symbol} className="px-4 py-2.5 flex items-center justify-between group">
                    <div>
                      <div className="font-mono text-[13px] font-bold text-foreground">{symbol}</div>
                      <div className="font-mono text-[11px] text-muted-foreground tabular-nums">
                        {pos.qty} x {formatINR(pos.avg_price)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] font-bold tabular-nums text-foreground">
                        {formatINR(pos.qty * pos.avg_price)}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleClose(symbol)}
                        className="font-mono text-[9px] tracking-widest bg-bear/10 text-bear px-2 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        CLOSE
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 font-mono text-[11px] text-muted-foreground">[NO_POSITIONS]</div>
            )}
          </div>

          {/* LLM Cost */}
          {cost && (
            <div className="border-t border-border px-4 py-2.5">
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
        </div>

        {/* Trade Log */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-border flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground">TRADE LOG</span>
            <input
              type="text"
              placeholder="Symbol..."
              value={filter.symbol}
              onChange={(e) => setFilter((f) => ({ ...f, symbol: e.target.value }))}
              className="font-mono text-[11px] bg-surface border border-border rounded-sm px-2 py-0.5 w-24 placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent"
            />
            <select
              value={filter.action}
              onChange={(e) => setFilter((f) => ({ ...f, action: e.target.value }))}
              className="font-mono text-[11px] bg-surface border border-border rounded-sm px-2 py-0.5 text-foreground focus:outline-none focus:border-accent"
            >
              <option value="">ALL</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-background">
                <tr className="font-mono text-[10px] tracking-widest text-muted-foreground border-b border-border">
                  <th className="text-left px-4 py-1.5 font-normal">TIME</th>
                  <th className="text-left px-4 py-1.5 font-normal">SYMBOL</th>
                  <th className="text-left px-4 py-1.5 font-normal">ACTION</th>
                  <th className="text-right px-4 py-1.5 font-normal">QTY</th>
                  <th className="text-right px-4 py-1.5 font-normal">PRICE</th>
                  <th className="text-right px-4 py-1.5 font-normal">P&L</th>
                  <th className="text-right px-4 py-1.5 font-normal">CAPITAL</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredTrades.map((trade) => (
                    <motion.tr
                      key={trade.order_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-border/50 font-mono text-[12px] hover:bg-surface transition-colors"
                    >
                      <td className="px-4 py-1.5 text-muted-foreground tabular-nums">
                        {new Date(trade.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-1.5 font-bold text-foreground">{trade.symbol}</td>
                      <td className={`px-4 py-1.5 font-bold ${trade.action === "BUY" ? "text-bull" : "text-bear"}`}>
                        {trade.action}
                      </td>
                      <td className="px-4 py-1.5 text-right tabular-nums text-foreground">{trade.quantity}</td>
                      <td className="px-4 py-1.5 text-right tabular-nums text-foreground">{formatINR(trade.fill_price)}</td>
                      <td className={`px-4 py-1.5 text-right tabular-nums ${trade.pnl != null ? (trade.pnl >= 0 ? "text-bull" : "text-bear") : "text-muted-foreground"}`}>
                        {trade.pnl != null ? `${trade.pnl >= 0 ? "+" : ""}${formatINR(trade.pnl)}` : "—"}
                      </td>
                      <td className="px-4 py-1.5 text-right tabular-nums text-muted-foreground">{formatINR(trade.capital_after)}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {filteredTrades.length === 0 && (
              <div className="px-4 py-6 font-mono text-[11px] text-muted-foreground text-center">[NO_TRADES]</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
