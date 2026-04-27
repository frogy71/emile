import { SkeletonStat, Skeleton } from "@/components/ui/skeleton";

/**
 * Streaming fallback for /dashboard. Mirrors the page's hero + KPI grid +
 * project list shape so the layout doesn't jump when the data arrives.
 */
export default function DashboardLoading() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-11 w-44 rounded-xl" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>

      <div className="mt-6">
        <Skeleton className="h-11 w-72 rounded-xl" />
      </div>

      <div className="mt-10 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-40 rounded-2xl"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
