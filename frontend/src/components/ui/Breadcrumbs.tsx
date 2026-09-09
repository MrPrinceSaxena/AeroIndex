import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface RouteLabelMap {
  [key: string]: string;
}

const ROUTE_LABELS: RouteLabelMap = {
  overview: "Overview",
  "index-series": "Air Fare Index",
  routes: "Route Analytics",
  explorer: "Data Explorer",
  quality: "Data Quality",
  benchmarking: "DGCA Benchmarking",
  methodology: "Methodology",
  health: "System Health",
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-apix-muted">
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-apix-text transition-colors"
        title="Return to Home"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">AeroIndex</span>
      </Link>

      {pathnames.map((segment, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;
        const label = ROUTE_LABELS[segment] || segment;

        return (
          <div key={routeTo} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-apix-faint shrink-0" />
            {isLast ? (
              <span className="font-semibold text-apix-text">{label}</span>
            ) : (
              <Link to={routeTo} className="hover:text-apix-text transition-colors">
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
