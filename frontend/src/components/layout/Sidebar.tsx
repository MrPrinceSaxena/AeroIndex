import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  LineChart,
  Waypoints,
  Table2,
  ShieldCheck,
  Landmark,
  BookOpen,
  Activity,
  Plane,
  X,
  LogOut,
  LogIn,
} from "lucide-react";
import { useSystemHealth } from "../../hooks/useSystemHealth";
import { useAuth } from "../../context/AuthContext";
import { relativeTime } from "../../utils/format";

interface NavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/overview", label: "Overview", Icon: LayoutDashboard },
  { to: "/index", label: "Air Fare Index", Icon: LineChart },
  { to: "/routes", label: "Route Analytics", Icon: Waypoints },
  { to: "/explorer", label: "Data Explorer", Icon: Table2 },
  { to: "/data-quality", label: "Data Quality", Icon: ShieldCheck },
  { to: "/benchmarking", label: "DGCA Benchmarking", Icon: Landmark },
  { to: "/methodology", label: "Methodology", Icon: BookOpen },
  { to: "/system-health", label: "System Health", Icon: Activity },
];

const STATUS_DOT: Record<string, string> = {
  healthy: "bg-apix-ok",
  degraded: "bg-apix-warn",
  down: "bg-apix-danger",
};

interface SidebarProps {
  onNavigate?: () => void;
  onClose?: () => void;
}

export function Sidebar({ onNavigate, onClose }: SidebarProps) {
  const health = useSystemHealth();
  const { user, isAuthenticated, logout } = useAuth();

  const latestIngest = health.data?.recent_runs?.[0]?.started_at ?? null;
  const status = health.data?.overall_status;

  return (
    <div className="flex h-full flex-col bg-apix-surface">
      {/* Brand */}
      <NavLink
        to="/"
        onClick={onNavigate}
        className="group flex items-start gap-3 px-5 py-5 transition-colors hover:bg-apix-surface-alt"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-apix-primary text-white shadow-sm transition-transform group-hover:scale-105">
          <Plane className="h-5.5 w-5.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl leading-none font-extrabold tracking-tight text-apix-text">APIx</span>
            <span className="rounded bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-300">
              HOME
            </span>
          </div>
          <div className="mt-1 text-[11px] leading-tight text-apix-muted">
            Air Fare Price Index
            <br />
            India
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onClose();
              }}
              aria-label="Close navigation"
              className="rounded-lg p-1.5 text-apix-muted hover:bg-apix-surface-alt lg:hidden"
            >
              <X className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </NavLink>

      {/* Nav */}
      <nav className="thin-scroll flex-1 space-y-0.5 overflow-y-auto px-3 pb-2" aria-label="Primary">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-apix-primary-soft text-apix-primary"
                  : "text-apix-text-soft hover:bg-apix-surface-alt"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`h-4 w-4 shrink-0 ${isActive ? "text-apix-primary" : "text-apix-faint"}`}
                  aria-hidden="true"
                />
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile / session card */}
      <div className="px-3 pb-2">
        {isAuthenticated && user ? (
          <div className="rounded-xl border border-apix-border bg-apix-surface-alt/70 p-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 text-xs font-bold text-white shadow-xs">
                {user.avatar_initials || user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-apix-text">{user.name}</div>
                <div className="truncate text-[10px] font-semibold text-blue-600 dark:text-cyan-400 capitalize">
                  {user.role} • {user.clearance_level.split(" ")[0]}
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="rounded-lg p-1.5 text-apix-muted hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <NavLink
            to="/login"
            onClick={onNavigate}
            className="flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-600 dark:text-cyan-400 hover:bg-blue-500/20 transition-colors"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In / Quick Pass</span>
          </NavLink>
        )}
      </div>

      {/* Live status — real values from /system/health */}
      <div className="px-3 pb-3">
        <div className="rounded-xl border border-apix-border bg-apix-surface-alt px-3 py-2">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                status ? STATUS_DOT[status] : "bg-apix-faint"
              }`}
            />
            <span className="text-[11px] font-semibold text-apix-text">
              {health.isLoading ? "Checking…" : status ? `Pipeline ${status}` : "Pipeline unknown"}
            </span>
          </div>
          <div className="mt-0.5 pl-4 text-[10px] text-apix-muted">
            {latestIngest ? `Data updated ${relativeTime(latestIngest)}` : "No ingestion runs yet"}
          </div>
        </div>
      </div>

      {/* Government attribution */}
      <div className="border-t border-apix-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-apix-surface-alt text-apix-muted">
            <Landmark className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div className="min-w-0 text-[10px] leading-tight">
            <div className="font-semibold text-apix-text-soft">Ministry of Civil Aviation</div>
            <div className="text-apix-muted">Government of India</div>
          </div>
        </div>
      </div>
    </div>
  );
}
