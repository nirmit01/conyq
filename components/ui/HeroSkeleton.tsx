// components/ui/HeroSkeleton.tsx
import { Skeleton } from './Skeleton';

export function HeroSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Main hero skeleton */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden" style={{ minHeight: '420px' }}>
          <Skeleton className="w-full h-full rounded-none" style={{ minHeight: '420px' }} />
        </div>

        {/* Secondary skeletons */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Skeleton className="flex-1 rounded-2xl" style={{ minHeight: '200px' }} />
          <Skeleton className="flex-1 rounded-2xl" style={{ minHeight: '200px' }} />
        </div>
      </div>
    </div>
  );
}

export function CategorySectionSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 pb-8">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-8 rounded-full" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex gap-3 flex-shrink-0" style={{ width: '320px' }}>
            <Skeleton className="w-32 h-22 rounded-lg" style={{ width: '128px', minHeight: '88px' }} />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrendingSidebarSkeleton() {
  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-6 w-6" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}