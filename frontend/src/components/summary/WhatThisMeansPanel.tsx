import { Lightbulb } from "lucide-react";

interface WhatThisMeansPanelProps {
  summary: string;
  hasSufficientData: boolean;
}

export function WhatThisMeansPanel({ summary, hasSufficientData }: WhatThisMeansPanelProps) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50 p-6">
      <div className="flex items-start gap-3">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-apix-real" aria-hidden="true" />
        <p className="text-sm font-medium text-apix-text">{summary}</p>
      </div>
      {hasSufficientData && (
        <p className="mt-3 text-xs leading-relaxed text-apix-muted">
          This sentence is auto-generated from the index data. A sustained rise above 110
          would signal fare-driven inflation in the transport CPI component, informing
          MoSPI's monthly price collection and RBI's inflation expectations.
        </p>
      )}
    </div>
  );
}
