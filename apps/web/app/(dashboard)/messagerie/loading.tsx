export default function MessagerieLoading() {
  return (
    <div className="flex h-full">
      {/* Sidebar skeleton */}
      <div className="flex w-full lg:w-80 flex-col border-r border-border/50">
        <div className="border-b p-4">
          <div className="h-6 w-32 animate-pulse rounded bg-muted/50" />
        </div>
        <div className="flex border-b">
          <div className="flex-1 py-2.5">
            <div className="mx-auto h-5 w-24 animate-pulse rounded bg-muted/40" />
          </div>
          <div className="flex-1 py-2.5">
            <div className="mx-auto h-5 w-24 animate-pulse rounded bg-muted/40" />
          </div>
        </div>
        <div className="flex-1 space-y-4 p-3">
          {[...Array(4)].map((_, g) => (
            <div key={g}>
              <div className="mb-2 h-3 w-1/3 animate-pulse rounded bg-muted/40" />
              <div className="space-y-1.5">
                <div className="h-7 animate-pulse rounded-md bg-muted/50" />
                <div className="h-7 w-5/6 animate-pulse rounded-md bg-muted/30" />
                <div className="h-7 w-2/3 animate-pulse rounded-md bg-muted/30" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main area placeholder */}
      <div className="hidden lg:flex flex-1 items-center justify-center">
        <div className="h-2 w-32 overflow-hidden rounded-full bg-muted/50">
          <div className="h-full w-1/3 animate-pulse bg-primary" />
        </div>
      </div>
    </div>
  );
}
