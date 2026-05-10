export default function AnnuaireLoading() {
  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <div className="h-7 w-40 animate-pulse rounded bg-muted/50" />
        <div className="mt-2 h-3 w-72 animate-pulse rounded bg-muted/30" />
      </div>

      <div className="mb-6 h-10 w-full max-w-md animate-pulse rounded-lg bg-muted/40" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-card p-4"
          >
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-muted/50" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted/50" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted/30" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-muted/30" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
