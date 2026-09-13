'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { KpiRow } from '@/components/nexus/kpi-row'
import { TicketFeed, Ticket } from '@/components/nexus/ticket-feed'
import { DashboardSkeleton } from '@/components/nexus/dashboard-skeleton'
import { Radio, Filter, ArrowRight, X, Clock, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useNexusData } from '@/lib/data-context'

function IncidentsContent() {
  const { incidents, loading } = useNexusData()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('selected')

  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)

  useEffect(() => {
    if (selectedId) {
      const match = incidents.find(
        (t) => t.id.replace('#', '') === selectedId.replace('#', '')
      )
      if (match) setSelectedTicket(match)
    } else {
      setSelectedTicket(null)
    }
  }, [selectedId, incidents])

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-cyan-500 animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-semibold">
              Transmisión de Incidentes en Tiempo Real
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Cola de Incidentes en Vivo
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Despacho en tiempo real, escalamiento automático de prioridad y monitoreo cuántico de SLA.
          </p>
        </div>
      </div>

      {/* Selected Ticket Drawer / Deep-linking Preview if URL has ?selected=... */}
      {selectedTicket && (
        <div className="nexus-glass-card border-cyan-500/50 rounded-2xl p-5 relative overflow-hidden animate-in fade-in slide-in-from-top-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan-500">{selectedTicket.id}</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-500 font-semibold">
                  Prioridad {selectedTicket.priority}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">· Enlace directo activo</span>
              </div>
              <h2 className="text-base font-bold text-foreground">{selectedTicket.title}</h2>
              <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground font-mono">
                <span>Servicio: <strong className="text-foreground">{selectedTicket.service}</strong></span>
                <span>Entorno: <strong className="text-foreground">{selectedTicket.env}</strong></span>
                <span>Asignado a: <strong className="text-foreground">{selectedTicket.assignee.name}</strong></span>
              </div>
              <div className="pt-2">
                <a
                  href={`/incidents/${selectedTicket.id.replace('#', '')}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline font-mono"
                >
                  <span>Abrir Espacio de Trabajo del Incidente</span>
                  <ArrowRight className="size-3.5" />
                </a>
              </div>
            </div>

            <button
              onClick={() => setSelectedTicket(null)}
              className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              title="Cerrar Vista Previa"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Row (Live Ticker, SLA countdown, MTTR Recharts sparkline, AI resolution rate) */}
      <KpiRow />

      {/* Ticket Feed (Tabs ?tab=..., Filters in URL, 12 realistic cards with SLA count, layout collapse) */}
      <TicketFeed />
    </div>
  )
}

export default function IncidentsPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <IncidentsContent />
    </Suspense>
  )
}
