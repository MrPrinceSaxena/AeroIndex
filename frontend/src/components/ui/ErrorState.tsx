import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  hint?: string;
}

export function ErrorState({ message, onRetry, hint }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 p-5 text-sm">
      <div className="flex items-start gap-2 text-red-700 dark:text-red-400">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          <span className="font-semibold">Could not load data: </span>
          {message}
        </p>
      </div>
      {hint && <p className="text-apix-muted">{hint}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white dark:border-red-800 dark:bg-red-950/50 dark:text-red-300 px-3 py-1.5 font-medium text-red-700 transition hover:bg-red-100 dark:hover:bg-red-900 focus-visible:ring-2 focus-visible:ring-apix-real"
          aria-label="Retry loading this data"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  );
}
