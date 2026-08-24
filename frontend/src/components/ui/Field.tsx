import type { ReactNode } from "react";

export const controlClasses =
  "w-full rounded-lg border border-apix-border bg-apix-surface px-2.5 py-1.5 text-[13px] text-apix-text " +
  "transition-colors hover:border-apix-border-strong focus-visible:ring-2 focus-visible:ring-apix-primary-ring";

interface FieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/** Labelled form control used across every filter bar. */
export function Field({ label, children, className = "" }: FieldProps) {
  return (
    <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="text-[11px] font-medium text-apix-muted">{label}</span>
      {children}
    </label>
  );
}

interface SelectFieldProps<T extends string | number> {
  label: string;
  value: T | "";
  onChange: (value: string) => void;
  options: { value: T; label: string }[];
  allLabel?: string;
  className?: string;
}

export function SelectField<T extends string | number>({
  label,
  value,
  onChange,
  options,
  allLabel,
  className,
}: SelectFieldProps<T>) {
  return (
    <Field label={label} className={className}>
      <select className={controlClasses} value={value} onChange={(e) => onChange(e.target.value)}>
        {allLabel && <option value="">{allLabel}</option>}
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** Filter bar container — a bordered strip that sits above the page's data. */
export function Toolbar({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 rounded-xl border border-apix-border bg-apix-surface p-3 sm:grid-cols-3 lg:grid-cols-6 ${className}`}
    >
      {children}
    </div>
  );
}
