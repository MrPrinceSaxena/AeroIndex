import { useState, useEffect } from "react";
import {
  Plane,
  Play,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Layers,
  Sliders,
  ShieldCheck,
  Clock,
  Radio,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { Panel } from "../ui/Panel";
import {
  triggerCustomScraperRun,
  getScraperStatus,
  probeLiveScrape,
  getScraperSources,
} from "../../api/client";
import type {
  ScraperStatusResponse,
  ScraperProbeResult,
  ScraperSourceInfo,
} from "../../types/apix";
import { formatFare } from "../../utils/format";

const ALL_ROUTES = [
  "DEL-BOM",
  "DEL-BLR",
  "BOM-BLR",
  "DEL-CCU",
  "BLR-HYD",
  "MAA-DEL",
];
const ALL_WINDOWS = [1, 7, 15, 30, 45];

interface Props {
  onRunCompleted?: () => void;
}

export function ScraperControlConsole({ onRunCompleted }: Props) {
  const [activeTab, setActiveTab] = useState<"pipeline" | "probe" | "sources">("pipeline");

  // Pipeline execution state
  const [selectedSources, setSelectedSources] = useState<string[]>([
    "air_india_direct",
    "indigo_direct",
  ]);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([
    "DEL-BOM",
    "DEL-BLR",
    "BOM-BLR",
  ]);
  const [selectedWindows, setSelectedWindows] = useState<number[]>([7, 30]);
  const [doGapFill, setDoGapFill] = useState(true);
  const [doCrossValidation, setDoCrossValidation] = useState(true);

  // Status & Telemetry
  const [status, setStatus] = useState<ScraperStatusResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Live Probe state
  const [probeCarrier, setProbeCarrier] = useState<"Air India" | "IndiGo">("Air India");
  const [probeRoute, setProbeRoute] = useState("DEL-BOM");
  const [probeWindow, setProbeWindow] = useState(7);
  const [isProbing, setIsProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<ScraperProbeResult | null>(null);

  // Sources catalog state
  const [sources, setSources] = useState<ScraperSourceInfo[]>([]);

  // Polling scraper status when active
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const fetchStatus = async () => {
      try {
        const s = await getScraperStatus();
        setStatus(s);
        if (s.is_running) {
          // Keep polling while running
        } else if (isSubmitting) {
          setIsSubmitting(false);
          if (onRunCompleted) onRunCompleted();
        }
      } catch (err) {
        console.error("Failed to fetch scraper status:", err);
      }
    };

    fetchStatus();
    interval = setInterval(fetchStatus, 3000);

    return () => clearInterval(interval);
  }, [isSubmitting, onRunCompleted]);

  // Load sources list
  useEffect(() => {
    getScraperSources()
      .then((res) => setSources(res.sources))
      .catch((err) => console.error("Failed to load sources:", err));
  }, []);

  const handleToggleSource = (source: string) => {
    setSelectedSources((prev) =>
      prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source]
    );
  };

  const handleToggleRoute = (route: string) => {
    setSelectedRoutes((prev) =>
      prev.includes(route)
        ? prev.filter((r) => r !== route)
        : [...prev, route]
    );
  };

  const handleToggleWindow = (win: number) => {
    setSelectedWindows((prev) =>
      prev.includes(win) ? prev.filter((w) => w !== win) : [...prev, win]
    );
  };

  const handleStartScraping = async () => {
    if (selectedSources.length === 0) {
      setFeedbackMsg({ type: "error", text: "Select at least one airline source (Air India or IndiGo)." });
      return;
    }
    if (selectedRoutes.length === 0) {
      setFeedbackMsg({ type: "error", text: "Select at least one flight route corridor." });
      return;
    }
    if (selectedWindows.length === 0) {
      setFeedbackMsg({ type: "error", text: "Select at least one advance-purchase window." });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedbackMsg({ type: "info", text: "Initiating live web scraping agents..." });
      const res = await triggerCustomScraperRun({
        sources: selectedSources,
        routes: selectedRoutes,
        advance_windows: selectedWindows,
        do_gap_fill: doGapFill,
        do_cross_validation: doCrossValidation,
      });
      setFeedbackMsg({
        type: "success",
        text: `Pipeline initiated! Run timestamp: ${res.timestamp}. Monitor progress in the Live Terminal below.`,
      });
      setTimeout(() => {
        getScraperStatus().then(setStatus);
      }, 1000);
    } catch (err: any) {
      setIsSubmitting(false);
      setFeedbackMsg({ type: "error", text: err.message || "Failed to trigger scraping pipeline." });
    }
  };

  const handleExecuteProbe = async () => {
    try {
      setIsProbing(true);
      setProbeResult(null);
      const res = await probeLiveScrape(probeCarrier, probeRoute, probeWindow);
      setProbeResult(res);
    } catch (err: any) {
      setProbeResult({
        success: false,
        carrier: probeCarrier,
        source_name: probeCarrier === "IndiGo" ? "indigo_direct" : "air_india_direct",
        route: probeRoute,
        advance_purchase_days: probeWindow,
        records_found: 0,
        error: err.message || "Probe request failed.",
      });
    } finally {
      setIsProbing(false);
    }
  };

  const isRunning = status?.is_running || isSubmitting;

  return (
    <Panel
      title="Live Scraper Control Console"
      caption="Direct command interface for real-time Air India & IndiGo flight data extraction, parametric triggers, and live fare inspection."
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-apix-border pb-3">
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === "pipeline"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-apix-surface text-apix-muted hover:bg-apix-border/40 hover:text-apix-text"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            Pipeline Orchestrator
            {isRunning && (
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("probe")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === "probe"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-apix-surface text-apix-muted hover:bg-apix-border/40 hover:text-apix-text"
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            Live Fare Test Probe
          </button>

          <button
            onClick={() => setActiveTab("sources")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === "sources"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-apix-surface text-apix-muted hover:bg-apix-border/40 hover:text-apix-text"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Audited Sources & Governance
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`rounded-xl p-3.5 text-xs font-medium flex items-center justify-between transition-all ${
              feedbackMsg.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : feedbackMsg.type === "error"
                ? "bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400"
                : "bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === "success" && <CheckCircle2 className="h-4 w-4" />}
              {feedbackMsg.type === "error" && <AlertTriangle className="h-4 w-4" />}
              {feedbackMsg.type === "info" && <Radio className="h-4 w-4 animate-pulse" />}
              <span>{feedbackMsg.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-xs opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: PIPELINE ORCHESTRATOR */}
        {activeTab === "pipeline" && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Airline Selectors */}
              <div className="rounded-xl border border-apix-border bg-apix-surface p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-apix-muted flex items-center gap-1.5">
                    <Plane className="h-3.5 w-3.5 text-blue-500" />
                    Target Airlines
                  </span>
                  <Badge tone="info">Source 1 & 2</Badge>
                </div>

                <div className="space-y-2">
                  <label
                    onClick={() => handleToggleSource("air_india_direct")}
                    className={`flex items-center justify-between rounded-lg border p-2.5 cursor-pointer transition-all ${
                      selectedSources.includes("air_india_direct")
                        ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
                        : "border-apix-border bg-apix-bg/50 text-apix-muted opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <div>
                        <div className="text-xs font-bold">Air India Direct</div>
                        <div className="text-[10px] opacity-80">GDS / Web Direct Stream</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedSources.includes("air_india_direct")}
                      readOnly
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                  </label>

                  <label
                    onClick={() => handleToggleSource("indigo_direct")}
                    className={`flex items-center justify-between rounded-lg border p-2.5 cursor-pointer transition-all ${
                      selectedSources.includes("indigo_direct")
                        ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                        : "border-apix-border bg-apix-bg/50 text-apix-muted opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                      <div>
                        <div className="text-xs font-bold">IndiGo Direct (6E)</div>
                        <div className="text-[10px] opacity-80">Domestic Carrier Engine</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedSources.includes("indigo_direct")}
                      readOnly
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                </div>
              </div>

              {/* Route Corridors */}
              <div className="rounded-xl border border-apix-border bg-apix-surface p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-apix-muted flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-blue-500" />
                    Domestic Corridors
                  </span>
                  <button
                    onClick={() =>
                      setSelectedRoutes(
                        selectedRoutes.length === ALL_ROUTES.length ? ["DEL-BOM"] : [...ALL_ROUTES]
                      )
                    }
                    className="text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {selectedRoutes.length === ALL_ROUTES.length ? "Reset" : "Select All"}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {ALL_ROUTES.map((route) => {
                    const isSelected = selectedRoutes.includes(route);
                    return (
                      <button
                        key={route}
                        type="button"
                        onClick={() => handleToggleRoute(route)}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-sm"
                            : "border border-apix-border bg-apix-bg text-apix-muted hover:text-apix-text"
                        }`}
                      >
                        {route}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advance Purchase Windows & Guards */}
              <div className="rounded-xl border border-apix-border bg-apix-surface p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-apix-muted flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    Lead-Time Windows
                  </span>
                  <Badge tone="neutral">{selectedWindows.length} Active</Badge>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {ALL_WINDOWS.map((win) => {
                    const isSelected = selectedWindows.includes(win);
                    return (
                      <button
                        key={win}
                        type="button"
                        onClick={() => handleToggleWindow(win)}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                          isSelected
                            ? "bg-violet-600 text-white shadow-sm"
                            : "border border-apix-border bg-apix-bg text-apix-muted hover:text-apix-text"
                        }`}
                      >
                        T+{win}d
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-apix-border/60 space-y-2">
                  <label className="flex items-center gap-2 text-xs text-apix-text cursor-pointer">
                    <input
                      type="checkbox"
                      checked={doGapFill}
                      onChange={(e) => setDoGapFill(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>DGCA Calibrated Gap-Filler</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-apix-text cursor-pointer">
                    <input
                      type="checkbox"
                      checked={doCrossValidation}
                      onChange={(e) => setDoCrossValidation(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Cross-Source Price Reconciliation</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Run Action Bar */}
            <div className="flex flex-wrap items-center justify-between rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-transparent p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
                  <Play className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-apix-text">
                    Execute Live Scraping Pipeline
                  </div>
                  <div className="text-xs text-apix-muted">
                    Scrapes {selectedSources.length} airlines across {selectedRoutes.length} corridors with {selectedWindows.length} advance windows.
                  </div>
                </div>
              </div>

              <div className="mt-3 sm:mt-0 flex items-center gap-2">
                <button
                  onClick={handleStartScraping}
                  disabled={isRunning}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Scraping in Progress ({status?.progress_pct ?? 0}%)...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      Start Scraping Engine
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Real-time Execution Terminal */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl text-slate-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  <span>PIPELINE ENGINE TELEMETRY</span>
                  {isRunning && (
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 animate-pulse">
                      LIVE ACTIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span>STEP:</span>
                  <span className="text-blue-400 font-bold uppercase">
                    {status?.current_step || "IDLE"}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>Execution Progress</span>
                  <span>{status?.progress_pct ?? 0}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${status?.progress_pct ?? 0}%` }}
                  />
                </div>
              </div>

              {/* Log window */}
              <div className="h-40 overflow-y-auto font-mono text-xs space-y-1.5 bg-slate-900/60 rounded-lg p-3 border border-slate-800/80">
                {status?.logs && status.logs.length > 0 ? (
                  status.logs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2 leading-relaxed text-slate-300">
                      <span className="text-slate-500 select-none">&gt;</span>
                      <span className={log.includes("FAILED") || log.includes("Error") ? "text-rose-400" : log.includes("Saved") || log.includes("completed") ? "text-emerald-300" : "text-slate-300"}>
                        {log}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 italic py-2">
                    Engine ready. Select parameters above and click "Start Scraping Engine" to observe live output.
                  </div>
                )}
              </div>

              {/* Last Run Summary Stats */}
              {status?.last_run_summary && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Air India Direct</div>
                    <div className="text-sm font-bold text-red-400">
                      {status.last_run_summary.air_india_records ?? 0} quotes
                    </div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">IndiGo Direct</div>
                    <div className="text-sm font-bold text-indigo-400">
                      {status.last_run_summary.indigo_records ?? 0} quotes
                    </div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Real Saved</div>
                    <div className="text-sm font-bold text-emerald-400">
                      {status.last_run_summary.real_saved ?? 0} rows
                    </div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Cross Validations</div>
                    <div className="text-sm font-bold text-blue-400">
                      {status.last_run_summary.cross_source_comparisons ?? 0} pairs
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LIVE FARE TEST PROBE */}
        {activeTab === "probe" && (
          <div className="space-y-5">
            <div className="rounded-xl border border-apix-border bg-apix-surface p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-apix-text">
                    Instant Live Flight Fare Probe
                  </h4>
                  <p className="text-xs text-apix-muted">
                    Test live scraper extraction against Air India or IndiGo for a specific route without modifying the production database.
                  </p>
                </div>
                <Badge tone="info">Ephemeral Test Query</Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-apix-muted block mb-1">
                    Select Carrier
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setProbeCarrier("Air India")}
                      className={`flex-1 rounded-lg border py-2 text-xs font-bold transition-all ${
                        probeCarrier === "Air India"
                          ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300"
                          : "border-apix-border bg-apix-bg text-apix-muted"
                      }`}
                    >
                      Air India
                    </button>
                    <button
                      type="button"
                      onClick={() => setProbeCarrier("IndiGo")}
                      className={`flex-1 rounded-lg border py-2 text-xs font-bold transition-all ${
                        probeCarrier === "IndiGo"
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                          : "border-apix-border bg-apix-bg text-apix-muted"
                      }`}
                    >
                      IndiGo (6E)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-apix-muted block mb-1">
                    Corridor Route
                  </label>
                  <select
                    value={probeRoute}
                    onChange={(e) => setProbeRoute(e.target.value)}
                    className="w-full rounded-lg border border-apix-border bg-apix-bg px-3 py-2 text-xs font-medium text-apix-text focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ALL_ROUTES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-apix-muted block mb-1">
                    Advance Window
                  </label>
                  <select
                    value={probeWindow}
                    onChange={(e) => setProbeWindow(Number(e.target.value))}
                    className="w-full rounded-lg border border-apix-border bg-apix-bg px-3 py-2 text-xs font-medium text-apix-text focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ALL_WINDOWS.map((w) => (
                      <option key={w} value={w}>
                        T+{w} Days Out
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleExecuteProbe}
                  disabled={isProbing}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 disabled:opacity-50 transition-all"
                >
                  {isProbing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Probing Live Airline DOM...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Probe Live Fare Card
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Probe Results Display */}
            {probeResult && (
              <div className="rounded-xl border border-apix-border bg-apix-surface p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-apix-border pb-3">
                  <div className="flex items-center gap-2">
                    {probeResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-rose-500" />
                    )}
                    <div>
                      <div className="text-sm font-bold text-apix-text">
                        Probe Results for {probeResult.carrier} on {probeResult.route} (T+{probeResult.advance_purchase_days})
                      </div>
                      <div className="text-xs text-apix-muted">
                        {probeResult.records_found} live fare quotes parsed in {probeResult.duration_seconds ?? 0}s
                      </div>
                    </div>
                  </div>
                  <Badge tone={probeResult.success && probeResult.records_found > 0 ? "success" : "neutral"}>
                    {probeResult.source_name}
                  </Badge>
                </div>

                {probeResult.quotes && probeResult.quotes.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {probeResult.quotes.map((q, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-apix-border/80 bg-apix-bg p-4 space-y-3 shadow-xs hover:border-blue-500/40 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-apix-text">Quote #{idx + 1}</span>
                          <span className="text-[10px] font-mono rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-400 font-bold">
                            OBSERVED
                          </span>
                        </div>

                        <div className="text-2xl font-extrabold text-apix-text tracking-tight">
                          {formatFare(q.total_fare)}
                        </div>

                        <div className="space-y-1 text-xs text-apix-muted border-t border-apix-border/60 pt-2 font-mono">
                          <div className="flex justify-between">
                            <span>Base Fare:</span>
                            <span className="font-semibold text-apix-text">
                              {q.base_fare ? formatFare(q.base_fare) : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Taxes & Fees (28%):</span>
                            <span className="font-semibold text-apix-text">
                              {q.taxes ? formatFare(q.taxes) : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Travel Date:</span>
                            <span className="text-apix-text">{q.travel_date}</span>
                          </div>
                        </div>

                        {q.provenance && (
                          <div className="text-[10px] text-apix-muted truncate bg-apix-surface p-1.5 rounded font-mono">
                            URL: {String((q.provenance as any).url || "Direct GDS")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-700 dark:text-amber-300">
                    No active non-stop quotes returned for this specific route and date cell (flight may be sold out or off-schedule).
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AUDITED SOURCES & GOVERNANCE */}
        {activeTab === "sources" && (
          <div className="grid gap-4 md:grid-cols-3">
            {sources.map((s) => (
              <div
                key={s.source_name}
                className="rounded-xl border border-apix-border bg-apix-surface p-5 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-apix-text flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    {s.display_name}
                  </span>
                  <Badge tone={s.source_name.includes("synthetic") ? "neutral" : "success"}>
                    {s.channel}
                  </Badge>
                </div>

                <p className="text-xs text-apix-muted leading-relaxed">
                  {s.description}
                </p>

                <div className="pt-2 border-t border-apix-border space-y-1 text-xs">
                  <div className="flex justify-between text-apix-muted">
                    <span>Carrier:</span>
                    <span className="font-semibold text-apix-text">{s.carrier}</span>
                  </div>
                  <div className="flex justify-between text-apix-muted">
                    <span>Compliance:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {s.compliance_status}
                    </span>
                  </div>
                  <div className="flex justify-between text-apix-muted">
                    <span>Supported Routes:</span>
                    <span className="text-apix-text font-mono text-[11px]">
                      {s.supported_routes.length} Sectors
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}
