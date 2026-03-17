import { Outlet, useLocation } from "react-router-dom";
import { NavLink } from "./NavLink";
import { useStatus, useWebSocket } from "@/hooks/use-trading-data";

const NAV_ITEMS = [
  { to: "/", label: "OVERVIEW" },
  { to: "/portfolio", label: "PORTFOLIO" },
  { to: "/debates", label: "DEBATES" },
  { to: "/agents", label: "AGENTS" },
  { to: "/watchlist", label: "WATCHLIST" },
  { to: "/timeline", label: "TIMELINE" },
  { to: "/settings", label: "SETTINGS" },
];

export function Layout() {
  const { data: status } = useStatus();
  const { connected } = useWebSocket();
  const location = useLocation();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Top Bar */}
      <div className="h-8 border-b border-border flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <NavLink
            to="/"
            className="font-mono text-[11px] font-bold tracking-tighter text-foreground hover:text-accent transition-colors"
          >
            SUDO_TRADE
          </NavLink>
          <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
            {status?.master_state?.toUpperCase() || "—"} // {status?.phase?.toUpperCase() || "—"}
          </span>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`font-mono text-[10px] px-2 py-0.5 rounded-sm transition-colors ${
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </NavLink>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-bull" : "bg-bear"}`} />
          <span className="font-mono text-[9px] text-muted-foreground">
            {connected ? "WS:LIVE" : "WS:OFF"}
          </span>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
