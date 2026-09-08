import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
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
        {/* Standalone Futuristic Glassmorphism Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Authentication Gateway */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Dashboard Routes wrapped with AppShell */}
        <Route
          path="/overview"
          element={
            <AppShell>
              <OverviewPage />
            </AppShell>
          }
        />
        <Route path="/dashboard" element={<Navigate to="/overview" replace />} />
        <Route
          path="/index"
          element={
            <AppShell>
              <AirFareIndexPage />
            </AppShell>
          }
        />
        <Route
          path="/routes"
          element={
            <AppShell>
              <RouteAnalyticsPage />
            </AppShell>
          }
        />
        <Route
          path="/explorer"
          element={
            <AppShell>
              <DataExplorerPage />
            </AppShell>
          }
        />
        <Route
          path="/data-quality"
          element={
            <AppShell>
              <DataQualityPage />
            </AppShell>
          }
        />
        <Route
          path="/benchmarking"
          element={
            <AppShell>
              <BenchmarkingPage />
            </AppShell>
          }
        />
        <Route
          path="/methodology"
          element={
            <AppShell>
              <MethodologyPage />
            </AppShell>
          }
        />
        <Route
          path="/system-health"
          element={
            <AppShell>
              <SystemHealthPage />
            </AppShell>
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


