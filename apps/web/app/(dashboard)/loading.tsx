export default function DashboardLoading() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="h-2 w-32 overflow-hidden rounded-full bg-muted/50">
        <div className="h-full w-1/3 animate-pulse bg-primary" />
      </div>
    </div>
  );
}
