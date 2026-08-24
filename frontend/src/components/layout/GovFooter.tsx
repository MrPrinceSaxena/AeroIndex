export function GovFooter() {
  return (
    <footer className="mt-8 border-t border-apix-border bg-[#0f1e3d] text-white">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-5 py-3.5 text-[12px] sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
          <span>Built for Transparency</span>
          <span className="text-white/40">•</span>
          <span>Built for Accuracy</span>
          <span className="text-white/40">•</span>
          <span>Built for Impact</span>
        </div>
        <div className="text-white/70">APIx — Powering Data-Driven Aviation Policy for India</div>
      </div>
    </footer>
  );
}
