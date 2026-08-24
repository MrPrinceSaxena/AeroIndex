import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X, Plane } from "lucide-react";

const LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/methodology", label: "Methodology" },
  { to: "/about", label: "About & Compliance" },
];

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-apix-real/10 text-apix-real" : "text-apix-muted hover:text-apix-text"
  }`;

export function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-apix-border bg-apix-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-apix-text">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-apix-real text-white">
            <Plane className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-base font-bold">APIx</span>
          <span className="hidden text-sm text-apix-muted sm:inline">India Airfare Price Index</span>
        </div>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === "/"} className={linkClasses}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="rounded-lg p-2 text-apix-text focus-visible:ring-2 focus-visible:ring-apix-real md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <nav
          className="flex flex-col gap-1 border-t border-apix-border px-4 py-3 md:hidden"
          aria-label="Primary"
        >
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={linkClasses}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
