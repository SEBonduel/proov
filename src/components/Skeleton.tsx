// Bloc squelette animé, réutilisé par les écrans de chargement (loading.tsx).
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/5 ${className}`} />;
}

/** Carte squelette générique (panneau sombre avec quelques lignes). */
export function SkeletonCard() {
  return (
    <div className="space-y-4 rounded-2xl p-6 panel">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-1/3" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-12" />
      </div>
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
