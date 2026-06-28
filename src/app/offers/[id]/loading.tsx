import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-4 w-28" />
      <div className="space-y-4 rounded-2xl p-7 panel">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-2xl p-5 panel">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-[72px] w-[72px] rounded-full" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-1.5 w-5/6 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
