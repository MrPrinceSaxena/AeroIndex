import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "estimated";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  info: "bg-apix-primary-soft text-apix-primary",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  danger: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  estimated: "bg-apix-badge-bg text-apix-badge-text",
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

export function Badge({ children, tone = "neutral", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] leading-tight font-semibold whitespace-nowrap ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Dot + label, for status rows where a coloured dot reads faster than a pill. */
export function StatusDot({ tone, label }: { tone: BadgeTone; label: string }) {
  const dot: Record<BadgeTone, string> = {
    neutral: "bg-slate-400",
    info: "bg-apix-primary",
    success: "bg-apix-ok",
    warning: "bg-apix-warn",
    danger: "bg-apix-danger",
    estimated: "bg-apix-estimated",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-apix-text">
      <span className={`h-2 w-2 rounded-full ${dot[tone]}`} />
      {label}
    </span>
  );
}
