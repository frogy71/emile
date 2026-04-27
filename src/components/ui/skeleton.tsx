import { cn } from "@/lib/utils";

/**
 * Neo-brutalist skeleton loader. Uses an animated gradient inside a
 * brutalist-bordered container so it visually matches the rest of the design
 * system instead of looking like generic placeholder gray.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "skeleton-shimmer rounded-xl border-2 border-border bg-secondary/60",
        className
      )}
      aria-hidden
      {...props}
    />
  );
}

export function SkeletonStat() {
  return (
    <div className="rounded-2xl border-2 border-border bg-secondary/40 p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-6 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrantCard() {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-[4px_4px_0px_0px_#1a1a1a]">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Skeleton className="h-5 w-14 rounded-md" />
            <Skeleton className="h-5 w-12 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
      </div>
    </div>
  );
}

export function SkeletonMatchCard() {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_#1a1a1a]">
      <div className="flex items-start gap-5">
        <div className="shrink-0 space-y-2 text-center">
          <Skeleton className="h-12 w-12 rounded-xl mx-auto" />
          <Skeleton className="h-3 w-12 rounded-md" />
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
