import { useState } from "react";
import { Info } from "lucide-react";

interface InfoTipProps {
  text: string;
}

/**
 * Small "what does this number mean" affordance. Opens on hover AND focus so
 * it is reachable by keyboard, and the text is always in the DOM for screen
 * readers rather than being injected on hover only.
 */
export function InfoTip({ text }: InfoTipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="text-apix-faint transition-colors hover:text-apix-primary"
        aria-label={text}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute top-5 right-0 z-30 w-56 rounded-lg border border-apix-border bg-apix-surface px-2.5 py-2 text-[11px] leading-snug font-normal text-apix-text-soft shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
