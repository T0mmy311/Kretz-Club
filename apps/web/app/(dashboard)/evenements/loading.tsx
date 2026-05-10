export default function EvenementsLoading() {
  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <div className="h-7 w-48 animate-pulse rounded bg-muted/50" />
        <div className="mt-2 h-3 w-80 animate-pulse rounded bg-muted/30" />
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted/40" />
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted/40" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border/50 bg-card"
          >
            <div className="animate-pulse">
              <div className="h-40 bg-muted/50" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 rounded bg-muted/50" />
                <div className="h-3 w-full rounded bg-muted/30" />
                <div className="space-y-1.5 pt-1">
                  <div className="h-3 w-2/3 rounded bg-muted/30" />
                  <div className="h-3 w-1/2 rounded bg-muted/30" />
                  <div className="h-3 w-1/3 rounded bg-muted/30" />
                </div>
                <div className="flex gap-2 pt-2">
                  <div className="h-9 flex-1 rounded-lg bg-muted/40" />
                  <div className="h-9 w-10 rounded-lg bg-muted/30" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
