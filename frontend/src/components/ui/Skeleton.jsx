export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-line/70 ${className}`} />;
}

export function JobCardSkeleton() {
  return (
    <div className="card flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-4/5" />
      <div className="mt-2 flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}
