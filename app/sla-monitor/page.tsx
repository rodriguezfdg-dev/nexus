'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  Clock,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  TrendingUp,
  ArrowRight,
  Filter,
  FileText,
  Search,
  CheckCircle2,
  Flame,
  ChevronRight,
  RotateCcw,
} from 'lucide-react'
import { TableSkeleton } from '@/components/nexus/state-skeletons'
import { EmptyState } from '@/components/nexus/empty-state'
import { ReportModal } from '@/components/nexus/report-modal'
import { useNexusData } from '@/lib/data-context'

interface SlaTicket {
  id: string
  title: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  service: string
  env: string
  assignee: {
    name: string
    initials: string
    status: 'online' | 'busy' | 'ai'
  }
  slaTotalSeconds: number
  slaRemainingSeconds: number
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3'
}

export default function SlaMonitorPage() {
  const { incidents, loading } = useNexusData()
  const [activeTierFilter, setActiveTierFilter] = useState<'all' | 'critical' | 'warning' | 'healthy'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [reportModalOpen, setReportModalOpen] = useState(false)

  // Derive SLA tickets dynamically from SQLite
  const tickets: SlaTicket[] = incidents
    .filter((inc) => inc.status !== 'Resolved')
    .map((inc) => ({
      id: inc.id,
      title: inc.title,
      priority: inc.priority,
      service: inc.service,
      env: inc.env,
      assignee: inc.assignee,
      slaTotalSeconds: inc.slaSecondsTotal,
      slaRemainingSeconds: inc.slaSecondsRemaining,
      tier: inc.priority === 'Critical' ? 'Tier 3' : inc.priority === 'High' ? 'Tier 2' : 'Tier 1',
    }))


  const formatTime = (totalSeconds: number) => {
    if (totalSeconds <= 0) return '00m 00s (BREACHED)'
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60

    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`
    }
    return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`
  }

  // Filter and sort tickets by SLA urgency (least remaining time first!)
  const filteredTickets = tickets
    .filter((t) => {
      if (activeTierFilter === 'critical') return t.slaRemainingSeconds < 900 // < 15m
      if (activeTierFilter === 'warning') return t.slaRemainingSeconds >= 900 && t.slaRemainingSeconds < 1800 // 15m - 30m
      if (activeTierFilter === 'healthy') return t.slaRemainingSeconds >= 1800 // > 30m
      return true
    })
    .filter((t) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.service.toLowerCase().includes(q) ||
        t.assignee.name.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => a.slaRemainingSeconds - b.slaRemainingSeconds)

  const criticalCount = tickets.filter((t) => t.slaRemainingSeconds < 900).length
  const warningCount = tickets.filter((t) => t.slaRemainingSeconds >= 900 && t.slaRemainingSeconds < 1800).length
  const healthyCount = tickets.filter((t) => t.slaRemainingSeconds >= 1800).length

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Continuous Telemetry Audit
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              SLO Target: 99.98% · Real-time Countdown
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            SLA & Availability Monitor
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Live queue of active tickets sorted strictly by SLA urgency. Track countdown clocks, error budgets, and breach prevention tiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setReportModalOpen(true)}
            className="quantum-gradient-btn flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-md"
          >
            <FileText className="size-4" />
            <span>Generate SLA Audit PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="nexus-glass-card rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>UPTIME AVAILABILITY</span>
            <ShieldCheck className="size-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-foreground">99.98%</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <span>Target: 99.90%</span>
            <span className="font-mono text-[10px]">(+0.08% buffer)</span>
          </div>
        </div>

        <div className="nexus-glass-card rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>IMMEDIATE SLA RISK</span>
            <Flame className="size-4 text-rose-500 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
            {criticalCount} Tickets
          </div>
          <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
            &lt; 15 minutes remaining
          </div>
        </div>

        <div className="nexus-glass-card rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>MEAN TIME TO RESOLVE</span>
            <Clock className="size-4 text-cyan-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-600 dark:text-cyan-400">
            11m 42s
          </div>
          <div className="text-xs text-muted-foreground font-semibold">
            -3m improvement vs last cycle
          </div>
        </div>

        <div className="nexus-glass-card rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>ERROR BUDGET (30D)</span>
            <AlertOctagon className="size-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
            84.2%
          </div>
          <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
            Stable · 32 days reserve
          </div>
        </div>
      </div>

      {/* 3. SLA Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-3">
        {/* Urgency Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All Active Tickets', count: tickets.length, tone: 'cyan' },
            { id: 'critical', label: 'Critical Risk (<15m)', count: criticalCount, tone: 'rose' },
            { id: 'warning', label: 'Warning (15m-30m)', count: warningCount, tone: 'amber' },
            { id: 'healthy', label: 'On Target (>30m)', count: healthyCount, tone: 'emerald' },
          ].map((tab) => {
            const isSelected = activeTierFilter === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTierFilter(tab.id as any)}
                className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition select-none shrink-0 ${
                  isSelected
                    ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 border border-cyan-500/40 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full border ${
                    tab.tone === 'rose'
                      ? 'border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : tab.tone === 'amber'
                      ? 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : tab.tone === 'emerald'
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'border-border bg-secondary text-muted-foreground'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search filter input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, title, service..."
            className="w-full rounded-xl border border-border bg-card/80 pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* 4. Urgency-Sorted SLA Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : filteredTickets.length > 0 ? (
        <div className="nexus-glass-card rounded-2xl overflow-hidden border border-border shadow-xl">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3.5 bg-secondary/50 border-b border-border text-[11px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">
            <div className="col-span-1">URGENCY</div>
            <div className="col-span-2">TICKET / SERVICE</div>
            <div className="col-span-4">INCIDENT TITLE & ROOT IMPACT</div>
            <div className="col-span-2">ASSIGNEE</div>
            <div className="col-span-2">SLA COUNTDOWN</div>
            <div className="col-span-1 text-right">ACTION</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-border/60">
            <AnimatePresence>
              {filteredTickets.map((ticket, index) => {
                const remaining = ticket.slaRemainingSeconds
                const isCritical = remaining < 900
                const isWarning = remaining >= 900 && remaining < 1800
                const pctRemaining = Math.min(100, Math.round((remaining / ticket.slaTotalSeconds) * 100))

                const tone = isCritical
                  ? {
                      border: 'border-rose-500/40',
                      badge: 'border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-400',
                      clockText: 'text-rose-600 dark:text-rose-400 font-bold',
                      barBg: 'bg-gradient-to-r from-rose-500 to-amber-500',
                      glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]',
                      rankBadge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
                    }
                  : isWarning
                  ? {
                      border: 'border-amber-500/40',
                      badge: 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-400',
                      clockText: 'text-amber-700 dark:text-amber-300 font-bold',
                      barBg: 'bg-gradient-to-r from-amber-500 to-yellow-400',
                      glow: 'shadow-[0_0_10px_rgba(245,158,11,0.2)]',
                      rankBadge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
                    }
                  : {
                      border: 'border-emerald-500/30',
                      badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                      clockText: 'text-emerald-700 dark:text-emerald-400 font-semibold',
                      barBg: 'bg-gradient-to-r from-cyan-500 to-emerald-500',
                      glow: '',
                      rankBadge: 'bg-secondary text-muted-foreground border-border',
                    }

                return (
                  <motion.div
                    key={ticket.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 sm:p-5 lg:grid lg:grid-cols-12 gap-4 items-center hover:bg-secondary/30 transition-colors group"
                  >
                    {/* 1. Urgency Rank */}
                    <div className="col-span-1 flex items-center gap-2 mb-2 lg:mb-0">
                      <span className={`font-mono text-xs px-2 py-0.5 rounded-lg border font-bold ${tone.rankBadge}`}>
                        #{index + 1}
                      </span>
                      {isCritical && (
                        <span className="flex size-2">
                          <span className="animate-ping absolute inline-flex size-2 rounded-full bg-rose-400 opacity-75" />
                          <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
                        </span>
                      )}
                    </div>

                    {/* 2. Ticket ID & Service */}
                    <div className="col-span-2 space-y-1 mb-2 lg:mb-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/incidents/${ticket.id}`}
                          className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
                        >
                          #{ticket.id}
                        </Link>
                        <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded border font-semibold ${tone.badge}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                        <span>{ticket.service}</span>
                        <span>·</span>
                        <span className="text-foreground/80">{ticket.env}</span>
                      </div>
                    </div>

                    {/* 3. Title */}
                    <div className="col-span-4 min-w-0 mb-3 lg:mb-0">
                      <Link
                        href={`/incidents/${ticket.id}`}
                        className="block text-xs sm:text-sm font-semibold text-foreground hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors line-clamp-1"
                      >
                        {ticket.title}
                      </Link>
                      <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        Assigned to {ticket.tier} escalation tier. Automated SLA monitoring active.
                      </div>
                    </div>

                    {/* 4. Assignee */}
                    <div className="col-span-2 flex items-center gap-2 mb-3 lg:mb-0">
                      <div className="size-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                        {ticket.assignee.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">
                          {ticket.assignee.name}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground capitalize">
                          {ticket.assignee.status === 'ai' ? 'Autonomous AI' : `${ticket.assignee.status} status`}
                        </div>
                      </div>
                    </div>

                    {/* 5. Live SLA Countdown Timer & Bar */}
                    <div className="col-span-2 space-y-1.5 mb-3 lg:mb-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-mono flex items-center gap-1.5 ${tone.clockText}`}>
                          <Clock className={`size-3.5 ${isCritical ? 'animate-spin' : ''}`} />
                          {formatTime(remaining)}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {pctRemaining}% Left
                        </span>
                      </div>

                      {/* Mini visual progress track */}
                      <div className="h-1.5 w-full rounded-full bg-secondary border border-border/80 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${tone.barBg}`}
                          style={{ width: `${pctRemaining}%` }}
                        />
                      </div>
                    </div>

                    {/* 6. Quick Action */}
                    <div className="col-span-1 flex justify-end">
                      <Link
                        href={`/incidents/${ticket.id}`}
                        className="flex items-center gap-1 rounded-lg border border-border bg-card hover:bg-secondary px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-cyan-500/40 transition group-hover:shadow-sm"
                      >
                        <span>Open</span>
                        <ChevronRight className="size-3 text-muted-foreground" />
                      </Link>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* Empty State */
        <EmptyState
          icon={CheckCircle2}
          badgeTone="emerald"
          badgeText="SLA STATUS: ALL COMPLIANT"
          title="No SLA Breaches in Selected Tier"
          description="All current incident tickets have healthy SLA margins or no tickets matched your current query filter."
          action={{
            label: 'View All SLA Tickets',
            icon: RotateCcw,
            onClick: () => {
              setActiveTierFilter('all')
              setSearchQuery('')
            },
          }}
        />
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportTitle="Comprehensive SLA Compliance Audit"
        scope="Global Edge & Core Database Telemetry"
      />
    </div>
  )
}
