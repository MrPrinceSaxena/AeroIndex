import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { ReactNode } from "react";
import { Plane } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-xl shadow-cyan-500/20 animate-pulse">
          <Plane className="h-8 w-8 text-white" />
        </div>
        <div className="mt-4 text-sm font-bold tracking-wide text-slate-300">
          Verifying Institutional Clearance...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page and preserve destination route
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return <>{children}</>;
}
