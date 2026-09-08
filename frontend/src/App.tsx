import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppShell } from "./components/layout/AppShell";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { OverviewPage } from "./pages/OverviewPage";
import { AirFareIndexPage } from "./pages/AirFareIndexPage";
import { RouteAnalyticsPage } from "./pages/RouteAnalyticsPage";
import { DataExplorerPage } from "./pages/DataExplorerPage";
import { DataQualityPage } from "./pages/DataQualityPage";
import { BenchmarkingPage } from "./pages/BenchmarkingPage";
import { MethodologyPage } from "./pages/MethodologyPage";
import { SystemHealthPage } from "./pages/SystemHealthPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Standalone Futuristic Glassmorphism Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Authentication Gateway */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected Dashboard & Analytics Routes — Login Required */}
        <Route
          path="/overview"
          element={
            <ProtectedRoute>
              <AppShell>
                <OverviewPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard" element={<Navigate to="/overview" replace />} />
        <Route
          path="/index"
          element={
            <ProtectedRoute>
              <AppShell>
                <AirFareIndexPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/routes"
          element={
            <ProtectedRoute>
              <AppShell>
                <RouteAnalyticsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/explorer"
          element={
            <ProtectedRoute>
              <AppShell>
                <DataExplorerPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/data-quality"
          element={
            <ProtectedRoute>
              <AppShell>
                <DataQualityPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/benchmarking"
          element={
            <ProtectedRoute>
              <AppShell>
                <BenchmarkingPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/methodology"
          element={
            <ProtectedRoute>
              <AppShell>
                <MethodologyPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/system-health"
          element={
            <ProtectedRoute>
              <AppShell>
                <SystemHealthPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Legacy redirects */}
        <Route path="/about" element={<Navigate to="/methodology" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;


