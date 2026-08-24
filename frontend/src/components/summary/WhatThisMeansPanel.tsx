import { Lightbulb } from "lucide-react";

interface WhatThisMeansPanelProps {
  summary: string;
  hasSufficientData: boolean;
}

export function WhatThisMeansPanel({ summary, hasSufficientData }: WhatThisMeansPanelProps) {
  return (
    <div className="h-full rounded-xl border border-apix-primary-ring bg-apix-primary-soft p-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-apix-primary text-white">
          <Lightbulb className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <div className="text-[12px] font-semibold tracking-wide text-apix-primary uppercase">
            What this means
          </div>
          <p className="mt-1 text-[14px] leading-snug font-medium text-apix-text">{summary}</p>
        </div>
      </div>
      {hasSufficientData && (
        <p className="mt-3 border-t border-apix-primary-ring/60 pt-3 text-[11px] leading-relaxed text-apix-muted">
          Auto-generated from the index series. A sustained rise above 110 would signal fare-driven
          inflation in the transport CPI component, informing MoSPI&apos;s monthly price collection and
          RBI&apos;s inflation expectations.
        </p>
      )}
    </div>
  );
}
