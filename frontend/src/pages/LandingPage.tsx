import { LandingNavbar } from "../components/landing/LandingNavbar";
import { HeroSection } from "../components/landing/HeroSection";
import { StatsSection } from "../components/landing/StatsSection";
import { FeatureCardsSection } from "../components/landing/FeatureCardsSection";
import { InteractiveIndiaMapSection } from "../components/landing/InteractiveIndiaMapSection";
import { PipelineSection } from "../components/landing/PipelineSection";
import { StakeholdersSection } from "../components/landing/StakeholdersSection";
import { MethodologyTrustSection } from "../components/landing/MethodologyTrustSection";
import { InstitutionalTrustSection } from "../components/landing/InstitutionalTrustSection";
import { CtaSection } from "../components/landing/CtaSection";
import { LandingFooter } from "../components/landing/LandingFooter";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* Glassmorphic Sticky Top Navigation */}
      <LandingNavbar />

      {/* 1. Cinematic Hero Section with Airplane Window & Floating Glass Card */}
      <HeroSection />

      {/* 2. Impact Statistics & Animated Counters */}
      <StatsSection />

      {/* 3. 6 Feature Modules Showcase */}
      <FeatureCardsSection />

      {/* 4. Interactive 3D Indian Aviation Corridor Radar */}
      <InteractiveIndiaMapSection />

      {/* 5. End-to-End Data Processing Pipeline Flow */}
      <PipelineSection />

      {/* 6. Stakeholders & Use Cases (MoSPI, RBI, Airlines, Researchers) */}
      <StakeholdersSection />

      {/* 7. Methodology, Mathematical Defense & Quarantine Architecture */}
      <MethodologyTrustSection />

      {/* 8. Institutional Foundations & Statutory Alignment */}
      <InstitutionalTrustSection />

      {/* 9. Final Dramatic Ascending Aircraft CTA */}
      <CtaSection />

      {/* 10. Comprehensive Footer */}
      <LandingFooter />
    </div>
  );
}
