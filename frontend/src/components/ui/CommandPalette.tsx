import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutDashboard,
  LineChart,
  Waypoints,
  Table2,
  ShieldCheck,
  Landmark,
  BookOpen,
  Activity,
  Sun,
  Moon,
  ExternalLink,
  Zap,
} from "lucide-react";
import { useTheme } from "../ThemeProvider";

interface SearchItem {
  id: string;
  title: string;
  category: "Navigation" | "Routes" | "Actions" | "Resources";
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  // Global keydown listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  const items: SearchItem[] = [
    {
      id: "nav-overview",
      title: "Overview — National Airfare Index Summary",
      category: "Navigation",
      icon: LayoutDashboard,
      action: () => {
        navigate("/overview");
        handleClose();
      },
    },
    {
      id: "nav-index",
      title: "Air Fare Index — Time Series & Lead Heatmap",
      category: "Navigation",
      icon: LineChart,
      action: () => {
        navigate("/index-series");
        handleClose();
      },
    },
    {
      id: "nav-routes",
      title: "Route Analytics — Lead-Time Elasticity & Weights",
      category: "Navigation",
      icon: Waypoints,
      action: () => {
        navigate("/routes");
        handleClose();
      },
    },
    {
      id: "nav-explorer",
      title: "Data Explorer — Raw Fare Quotes Microdata",
      category: "Navigation",
      icon: Table2,
      action: () => {
        navigate("/explorer");
        handleClose();
      },
    },
    {
      id: "nav-quality",
      title: "Data Quality — Outlier Rejection & Scorecard",
      category: "Navigation",
      icon: ShieldCheck,
      action: () => {
        navigate("/quality");
        handleClose();
      },
    },
    {
      id: "nav-benchmarking",
      title: "DGCA Benchmarking — Official Tariff Backtesting",
      category: "Navigation",
      icon: Landmark,
      action: () => {
        navigate("/benchmarking");
        handleClose();
      },
    },
    {
      id: "nav-methodology",
      title: "Methodology & Governance — Mathematical Formulas",
      category: "Navigation",
      icon: BookOpen,
      action: () => {
        navigate("/methodology");
        handleClose();
      },
    },
    {
      id: "nav-health",
      title: "System Health & Pipelines — Telemetry & Logs",
      category: "Navigation",
      icon: Activity,
      action: () => {
        navigate("/health");
        handleClose();
      },
    },
    {
      id: "action-theme",
      title: `Toggle Theme (Current: ${theme === "dark" ? "Dark Mode" : "Light Mode"})`,
      category: "Actions",
      icon: theme === "dark" ? Sun : Moon,
      action: () => {
        setTheme(theme === "dark" ? "light" : "dark");
        handleClose();
      },
      shortcut: "T",
    },
    {
      id: "res-docs",
      title: "FastAPI Interactive Swagger Docs (/docs)",
      category: "Resources",
      icon: ExternalLink,
      action: () => {
        window.open("/docs", "_blank");
        handleClose();
      },
    },
  ];

  const filteredItems = query.trim()
    ? items.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  // Key navigation within palette
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].action();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        type="button"
        title="Quick Search (Cmd+K)"
        className="hidden md:flex items-center gap-2 rounded-xl border border-apix-border bg-apix-surface-alt/70 px-2.5 py-1.5 text-xs text-apix-muted hover:border-apix-primary/40 hover:text-apix-text transition-all"
      >
        <Search className="h-3.5 w-3.5 text-apix-muted" />
        <span className="font-medium">Quick search...</span>
        <kbd className="rounded border border-apix-border bg-apix-surface px-1.5 py-0.5 text-[10px] font-mono text-apix-muted shadow-xs">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 sm:pt-24 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-apix-border bg-apix-surface shadow-2xl shadow-black/40 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-apix-border px-4 py-3.5 bg-apix-surface-alt/50">
          <Search className="h-5 w-5 text-apix-primary shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search corridors, pages, actions, or docs..."
            className="w-full bg-transparent text-sm text-apix-text placeholder-apix-muted outline-hidden font-sans"
          />
          <kbd
            onClick={handleClose}
            className="cursor-pointer rounded border border-apix-border bg-apix-surface px-2 py-0.5 text-[11px] font-mono text-apix-muted hover:text-apix-text transition-colors"
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto p-2 space-y-1 thin-scroll">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-apix-muted">
              No matching pages or actions found for "{query}"
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs transition-colors ${
                    isSelected
                      ? "bg-apix-primary text-white shadow-xs"
                      : "text-apix-text hover:bg-apix-surface-alt"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isSelected ? "text-white" : "text-apix-muted"
                      }`}
                    />
                    <span className="truncate font-medium">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-apix-surface-alt text-apix-muted border border-apix-border"
                      }`}
                    >
                      {item.category}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between border-t border-apix-border px-4 py-2 bg-apix-surface-alt/40 text-[11px] text-apix-muted font-sans">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono font-semibold text-apix-text">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="font-mono font-semibold text-apix-text">↵</kbd> Select
            </span>
            <span>
              <kbd className="font-mono font-semibold text-apix-text">esc</kbd> Dismiss
            </span>
          </div>
          <div className="flex items-center gap-1 text-apix-primary font-medium">
            <Zap className="h-3 w-3" />
            <span>AeroIndex Command Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
