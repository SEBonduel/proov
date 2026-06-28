import { Skeleton, SkeletonCard } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-12">
      <Skeleton className="h-64 rounded-3xl sm:h-72" />
      <div className="space-y-5">
        <Skeleton className="h-5 w-40" />
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
