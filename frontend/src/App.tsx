import { Navigate, Route, Routes } from "react-router-dom";
import { NavBar } from "./components/layout/NavBar";
import { Footer } from "./components/layout/Footer";
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
    <div className="flex min-h-screen flex-col bg-apix-bg text-apix-text">
      <NavBar />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6">
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/index" element={<AirFareIndexPage />} />
          <Route path="/routes" element={<RouteAnalyticsPage />} />
          <Route path="/explorer" element={<DataExplorerPage />} />
          <Route path="/data-quality" element={<DataQualityPage />} />
          <Route path="/benchmarking" element={<BenchmarkingPage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="/system-health" element={<SystemHealthPage />} />
          {/* Retired page -- redirect so no old link 404s */}
          <Route path="/about" element={<Navigate to="/methodology" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
