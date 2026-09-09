import { useState, useEffect } from "react";
import { Keyboard, X } from "lucide-react";

interface ShortcutGroup {
  name: string;
  items: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    name: "General & Navigation",
    items: [
      { keys: ["⌘", "K"], description: "Open Command Palette / Fast Search" },
      { keys: ["?"], description: "Toggle Keyboard Shortcuts Modal" },
      { keys: ["T"], description: "Toggle Dark / Light Theme" },
      { keys: ["Esc"], description: "Close active modal / overlay" },
    ],
  },
  {
    name: "Dashboard Corridors",
    items: [
      { keys: ["DEL", "BOM"], description: "Delhi — Mumbai Trunk Corridor (43.8% Weight)" },
      { keys: ["DEL", "BLR"], description: "Delhi — Bengaluru Tech Corridor (32.2% Weight)" },
      { keys: ["BOM", "BLR"], description: "Mumbai — Bengaluru Commercial Corridor (24.0% Weight)" },
    ],
  },
];

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "?" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-apix-border bg-apix-surface shadow-2xl shadow-black/50 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-apix-border px-5 py-4 bg-apix-surface-alt/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-apix-primary/10 text-apix-primary border border-apix-primary/20">
              <Keyboard className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-apix-text">Keyboard Shortcuts & Navigation</h3>
              <p className="text-[11px] text-apix-muted">High-frequency terminal shortcuts for researchers</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-apix-muted hover:bg-apix-surface hover:text-apix-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-5 space-y-5 thin-scroll">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.name} className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-apix-muted">
                {group.name}
              </h4>
              <div className="rounded-xl border border-apix-border bg-apix-surface-alt/30 divide-y divide-apix-border">
                {group.items.map((item) => (
                  <div
                    key={item.description}
                    className="flex items-center justify-between px-3.5 py-2.5 text-xs text-apix-text"
                  >
                    <span>{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="min-w-[20px] text-center rounded border border-apix-border bg-apix-surface px-1.5 py-0.5 text-[11px] font-mono font-semibold text-apix-text shadow-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-apix-border px-5 py-3 bg-apix-surface-alt/40 flex items-center justify-between text-[11px] text-apix-muted">
          <span>Press <kbd className="font-mono text-apix-text">?</kbd> anywhere to toggle this guide</span>
          <span className="font-medium text-apix-primary">AeroIndex Terminal</span>
        </div>
      </div>
    </div>
  );
}
