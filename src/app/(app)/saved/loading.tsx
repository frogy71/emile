import { SkeletonGrantCard, Skeleton } from "@/components/ui/skeleton";

export default function SavedLoading() {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-11 w-44 rounded-xl" />
      </div>
      <div className="mt-8 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonGrantCard key={i} />
        ))}
      </div>
    </div>
  );
}
