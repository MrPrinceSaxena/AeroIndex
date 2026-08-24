interface LoadingSkeletonProps {
  height?: number;
  label?: string;
}

export function LoadingSkeleton({ height = 240, label = "Loading" }: LoadingSkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className="w-full animate-pulse rounded-xl bg-apix-border/60"
      style={{ height }}
    >
      <span className="sr-only">{label}…</span>
    </div>
  );
}
