'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Clock,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Radio,
  Flame,
  CheckCircle2
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip
} from 'recharts'
import { useLanguage } from '@/lib/i18n/context'
import { useNexusData } from '@/lib/data-context'

// Sparkline data for MTTR intervals
const mttrSparklineData = [
  { time: '10:00', mttr: 12.0 },
  { time: '12:00', mttr: 11.5 },
  { time: '14:00', mttr: 10.2 },
  { time: '16:00', mttr: 9.8 },
]

export function KpiRow() {
  const { t } = useLanguage()
  const { incidents } = useNexusData()
  const [mounted, setMounted] = useState(false)

  const openIncidents = incidents.filter((i) => i.status !== 'Resolved')
  const activeCount = openIncidents.length
  const criticalCount = openIncidents.filter((i) => i.priority === 'Critical').length
  const aiTriagedCount = openIncidents.filter((i) => i.aiTriaged).length
  const aiRate = activeCount > 0 ? Math.round((aiTriagedCount / activeCount) * 100) : 0
  const mostUrgentSla =
    openIncidents.length > 0
      ? Math.min(...openIncidents.map((i) => i.slaSecondsRemaining))
      : 0
  const mttrSeconds = activeCount > 0 ? 702 : 0

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
  }

  const formatMttr = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60)
    const s = totalSecs % 60
    return `${m}m ${String(s).padStart(2, '0')}s`
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      
      {/* 1. Active Incidents Card - Live Ticker Feel */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="nexus-glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/50 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              {t.dashboard.kpi_active_incidents}
            </span>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold">
            ● LIVE
          </span>
        </div>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="font-mono text-4xl font-extrabold text-foreground tracking-tight">
            {activeCount}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            Open Incidents
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between pt-3 border-t border-border/60 text-xs">
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-mono text-[11px] font-semibold">
            <Flame className="size-3.5" />
            {criticalCount} Critical (P1)
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {activeCount === 0 ? 'Sin alertas' : 'Cola activa'}
          </span>
        </div>
      </motion.div>

      {/* 2. SLA Breach Risk (<15m Countdown Style) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="nexus-glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/50 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500 animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              {t.dashboard.kpi_sla_risk}
            </span>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold">
            {mostUrgentSla > 0 && mostUrgentSla < 900 ? '< 15m THREAT' : 'SLA EN RANGO'}
          </span>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-amber-600 dark:text-[#F5BA67] drop-shadow-[0_0_12px_rgba(245,186,103,0.3)]">
            {mostUrgentSla > 0 ? formatCountdown(mostUrgentSla) : '--'}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between pt-3 border-t border-border/60 text-xs">
          <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400 font-medium">
            {openIncidents[0] ? `${openIncidents[0].id} · ${openIncidents[0].service}` : 'Sin riesgos inminentes'}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {openIncidents.length > 0 ? 'Monitoreo en vivo' : 'Normal'}
          </span>
        </div>
      </motion.div>

      {/* 3. MTTR with Mini Sparkline (Recharts) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="nexus-glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/50 transition-all flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-cyan-500" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {t.dashboard.kpi_mttr}
              </span>
            </div>
            <span className="flex items-center gap-0.5 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingDown className="size-3" /> -18.2%
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-foreground tracking-tight">
              {formatMttr(mttrSeconds)}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              Target: 15m
            </span>
          </div>
        </div>

        {/* Mini Recharts Sparkline */}
        <div className="mt-2 h-10 w-full">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mttrSparklineData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <defs>
                  <linearGradient id="cyanSparkline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-md border border-cyan-500/30 bg-popover/90 px-2 py-1 text-[10px] font-mono shadow-md backdrop-blur-md">
                          {payload[0].value}m MTTR
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="mttr"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#cyanSparkline)"
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* 4. AI Resolution Rate (% + Status Badge) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="nexus-glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-violet-500/50 transition-all flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-violet-500" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {t.dashboard.kpi_ai_rate}
              </span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300 font-semibold">
              Autonomous
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-4xl font-extrabold text-foreground tracking-tight">
              {aiRate}%
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Self-Healed
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border/60">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="size-3.5" />
              Quantum Triage
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              {aiTriagedCount}/{activeCount} Triaged
            </span>
          </div>
        </div>
      </motion.div>

    </div>
  )
}
