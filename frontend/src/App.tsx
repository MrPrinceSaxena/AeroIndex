import { Route, Routes } from "react-router-dom";
import { NavBar } from "./components/layout/NavBar";
import { Footer } from "./components/layout/Footer";
import { DashboardPage } from "./pages/DashboardPage";
import { MethodologyPage } from "./pages/MethodologyPage";
import { AboutCompliancePage } from "./pages/AboutCompliancePage";

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-apix-bg text-apix-text">
      <NavBar />
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8 sm:px-6">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="/about" element={<AboutCompliancePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
