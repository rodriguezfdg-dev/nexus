'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { KpiRow } from '@/components/nexus/kpi-row'
import { TicketFeed } from '@/components/nexus/ticket-feed'
import { DashboardSkeleton } from '@/components/nexus/dashboard-skeleton'
import { ReportModal } from '@/components/nexus/report-modal'
import { Sparkles, FileText, DownloadCloud } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

function DashboardContent() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [reportModalOpen, setReportModalOpen] = useState(false)

  useEffect(() => {
    // Brief initial shimmer skeleton on page load (500ms)
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Banner / Welcome context */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-semibold">
              {t.dashboard.badge}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {t.dashboard.telemetry_sub}
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t.dashboard.title}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t.dashboard.description}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* SLA Target Card */}
          <div className="hidden sm:block rounded-xl border border-border bg-card/80 px-3.5 py-2 text-right shadow-sm">
            <div className="font-mono text-[10px] text-muted-foreground uppercase">{t.dashboard.sla_target_label}</div>
            <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">{t.dashboard.sla_target_val}</div>
          </div>

          {/* Accessible Generate Report Button */}
          <button
            onClick={() => setReportModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 px-3.5 py-2 text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.18)] select-none"
            title="Compile and export live SLA & incident report"
          >
            <FileText className="size-4 text-cyan-600 dark:text-cyan-400" />
            <span>{t.dashboard.generate_report}</span>
          </button>
        </div>
      </div>

      {/* Report Generation Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportTitle="Monthly Operations & SLA Post-Mortem"
        scope="US-East & EU-West Live Telemetry"
      />

      {/* 1. Top KPI Row (4 Animated Cards with Count-up and Recharts Sparkline) */}
      <KpiRow />

      {/* 2 & 3 & 4. Ticket Feed (Tabs, Filters in URL, 12 Cards with SLA Countdown, Layout Collapse) */}
      <TicketFeed />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
