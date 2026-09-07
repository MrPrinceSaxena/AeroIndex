import type { ReactNode } from "react";
import { ThemeToggle } from "../ThemeToggle";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[20px] leading-tight font-bold tracking-tight text-apix-text sm:text-[22px]">
          {title}
        </h1>
        {subtitle && <p className="mt-1 max-w-3xl text-[13px] leading-snug text-apix-muted">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        <div className="hidden lg:block">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
