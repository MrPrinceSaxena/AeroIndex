import { Info } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  message: string;
  children?: ReactNode;
}

export function EmptyState({ message, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 p-5 text-sm text-apix-muted">
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-apix-real" aria-hidden="true" />
        <p>{message}</p>
      </div>
      {children}
    </div>
  );
}
