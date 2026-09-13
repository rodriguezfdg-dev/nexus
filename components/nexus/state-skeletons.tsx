'use client'

import React from 'react'

/**
 * Primitive Shimmer Box with Theme-aware Neon Gradient Sweep
 */
export function ShimmerBox({ className = '' }: { className?: string }) {
  return (
    <div
      className={`skeleton-shimmer rounded-md ${className}`}
      aria-hidden="true"
    />
  )
}

/**
 * 1. Card Skeleton Loader
 * Matches incident/ticket cards across NexusDesk with realistic proportions
 */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`nexus-glass-card rounded-2xl p-5 space-y-4 relative overflow-hidden transition-all ${className}`}
      aria-label="Loading card content"
    >
      {/* Top Header: ID & Priority pill */}
      <div className="flex items-center justify-between">
        <ShimmerBox className="h-4 w-24 rounded font-mono" />
        <ShimmerBox className="h-5 w-20 rounded-full" />
      </div>

      {/* Main Title & Description */}
      <div className="space-y-2 py-1">
        <ShimmerBox className="h-4.5 w-full rounded" />
        <ShimmerBox className="h-3.5 w-4/5 rounded" />
      </div>

      {/* Tags / Service Chips */}
      <div className="flex items-center gap-2 pt-1">
        <ShimmerBox className="h-5 w-20 rounded-md" />
        <ShimmerBox className="h-5 w-16 rounded-md" />
        <ShimmerBox className="h-5 w-14 rounded-md" />
      </div>

      {/* Divider */}
      <div className="border-t border-border/60 pt-3" />

      {/* Footer: Assignee & SLA Countdown Timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShimmerBox className="size-6 rounded-full shrink-0" />
          <ShimmerBox className="h-3.5 w-20 rounded" />
        </div>
        <ShimmerBox className="h-5 w-20 rounded-full" />
      </div>
    </div>
  )
}

/**
 * 2. KPI Card Skeleton Loader
 * Matches the 4 Mission-Control KPI metrics on Dashboard
 */
export function KpiCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`nexus-glass-card rounded-2xl p-5 space-y-3 relative overflow-hidden transition-all ${className}`}
      aria-label="Loading metric card"
    >
      {/* Top Title & Icon */}
      <div className="flex items-center justify-between">
        <ShimmerBox className="h-3.5 w-28 rounded font-mono" />
        <ShimmerBox className="size-6 rounded-lg" />
      </div>

      {/* Large Value Metric */}
      <div className="flex items-baseline gap-2 pt-1">
        <ShimmerBox className="h-9 w-28 rounded-lg" />
        <ShimmerBox className="h-4 w-12 rounded" />
      </div>

      {/* Sparkline mini-graph / progress track simulation */}
      <div className="pt-2 pb-1">
        <ShimmerBox className="h-6 w-full rounded-md opacity-70" />
      </div>

      {/* Subtext and Delta Trend */}
      <div className="flex items-center justify-between pt-1">
        <ShimmerBox className="h-3 w-32 rounded" />
        <ShimmerBox className="h-4 w-14 rounded-full" />
      </div>
    </div>
  )
}

/**
 * 3. Table Row Skeleton Loader
 * Matches dense list views, incident tables, and audit logs
 */
export function TableRowSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-3.5 border-b border-border/60 hover:bg-muted/20 transition-colors ${className}`}
      aria-label="Loading table row"
    >
      {/* Indicator & Monospace ID */}
      <div className="flex items-center gap-3 w-36 shrink-0">
        <ShimmerBox className="size-3 rounded-full shrink-0" />
        <ShimmerBox className="h-3.5 w-20 rounded font-mono" />
      </div>

      {/* Title / Summary */}
      <div className="flex-1 min-w-[180px] space-y-1">
        <ShimmerBox className="h-3.5 w-3/4 rounded" />
      </div>

      {/* Priority Pill */}
      <div className="w-24 shrink-0 hidden sm:block">
        <ShimmerBox className="h-5 w-20 rounded-full" />
      </div>

      {/* Service / Node Chip */}
      <div className="w-28 shrink-0 hidden md:block">
        <ShimmerBox className="h-5 w-24 rounded-md" />
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-2 w-32 shrink-0 hidden lg:flex">
        <ShimmerBox className="size-5 rounded-full shrink-0" />
        <ShimmerBox className="h-3 w-20 rounded" />
      </div>

      {/* Timestamp / SLA */}
      <div className="w-24 shrink-0 text-right flex justify-end">
        <ShimmerBox className="h-4 w-16 rounded font-mono" />
      </div>
    </div>
  )
}

/**
 * Table Skeleton Wrapper with Mock Header
 */
export function TableSkeleton({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`nexus-glass-card rounded-2xl overflow-hidden border border-border/80 ${className}`}>
      {/* Table Header */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-secondary/50 border-b border-border text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
        <div className="w-36">Incident ID</div>
        <div className="flex-1 min-w-[180px]">Summary & Root Cause</div>
        <div className="w-24 hidden sm:block">Priority</div>
        <div className="w-28 hidden md:block">Target Node</div>
        <div className="w-32 hidden lg:block">Assignee</div>
        <div className="w-24 text-right">SLA Time</div>
      </div>

      {/* Rows */}
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
