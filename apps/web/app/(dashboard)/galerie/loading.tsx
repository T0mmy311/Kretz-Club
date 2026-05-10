export default function GalerieLoading() {
  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <div className="h-7 w-32 animate-pulse rounded bg-muted/50" />
        <div className="mt-2 h-3 w-80 animate-pulse rounded bg-muted/30" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border/50 bg-card"
          >
            <div className="aspect-[16/10] animate-pulse bg-muted/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
