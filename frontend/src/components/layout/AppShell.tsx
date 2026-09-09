import { useState, type ReactNode } from "react";
import { Menu, Plane } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { GovFooter } from "./GovFooter";
import { ThemeToggle } from "../ThemeToggle";
import { CommandPalette } from "../ui/CommandPalette";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-apix-bg">
      {/* Persistent sidebar on large screens */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[218px] border-r border-apix-border lg:block">
        <Sidebar />
      </aside>

      {/* Mobile / tablet drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[264px] max-w-[82vw] border-r border-apix-border shadow-xl">
            <Sidebar onNavigate={() => setDrawerOpen(false)} onClose={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:pl-[218px]">

        {/* Compact top bar — only carries the drawer toggle + brand below lg */}
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-apix-border bg-apix-surface/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="rounded-lg p-2 text-apix-text hover:bg-apix-surface-alt"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-apix-primary text-white">
            <Plane className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-base font-extrabold tracking-tight text-apix-text">APIx</span>
          <span className="truncate text-xs text-apix-muted">Air Fare Price Index</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 sm:px-6 lg:px-7 lg:py-7">
          {children}
        </main>

        <CommandPalette />

        <GovFooter />
      </div>
    </div>
  );
}
