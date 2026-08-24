interface EstimatedBadgeProps {
  label?: string;
}

export function EstimatedBadge({ label = "includes estimates" }: EstimatedBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-md bg-apix-badge-bg px-2 py-0.5 text-xs font-semibold text-apix-badge-text">
      {label}
    </span>
  );
}
