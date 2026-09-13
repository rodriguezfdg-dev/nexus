'use client'

import { KpiCardSkeleton, CardSkeleton, ShimmerBox } from '@/components/nexus/state-skeletons'

export function DashboardSkeleton() {
  return (
    <div className="w-full space-y-8">
      {/* 1. KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      {/* 2. Tabs & Filters Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex gap-2">
          <ShimmerBox className="h-8 w-24 rounded-lg" />
          <ShimmerBox className="h-8 w-28 rounded-lg" />
          <ShimmerBox className="h-8 w-32 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <ShimmerBox className="h-8 w-28 rounded-lg" />
          <ShimmerBox className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      {/* 3. Ticket Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
