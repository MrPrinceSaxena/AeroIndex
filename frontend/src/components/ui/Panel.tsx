import type { ReactNode } from "react";

interface PanelProps {
  title?: ReactNode;
  caption?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** The standard card container: white surface, subtle border, optional header row. */
export function Panel({ title, caption, actions, children, className = "", bodyClassName = "" }: PanelProps) {
  const hasHeader = Boolean(title || caption || actions);
  return (
    <section className={`rounded-xl border border-apix-border bg-apix-surface ${className}`}>
      {hasHeader && (
        <div className="flex flex-col gap-2 border-b border-apix-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            {title && <h2 className="text-[14px] leading-tight font-semibold text-apix-text">{title}</h2>}
            {caption && <p className="mt-0.5 text-[12px] leading-snug text-apix-muted">{caption}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`p-4 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
