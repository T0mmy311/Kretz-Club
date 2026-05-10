export default function FacturesLoading() {
  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <div className="h-7 w-40 animate-pulse rounded bg-muted/50" />
        <div className="mt-2 h-3 w-72 animate-pulse rounded bg-muted/30" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border/50 p-4 last:border-b-0"
          >
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-muted/50" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted/50" />
              <div className="h-3 w-1/4 animate-pulse rounded bg-muted/30" />
            </div>
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
