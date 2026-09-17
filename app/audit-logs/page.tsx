'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Search,
  Filter,
  ArrowRight,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  FileText,
  BarChart3,
  Download,
  RotateCcw,
  ChevronRight,
  ExternalLink,
  X,
  Calendar,
  Sparkles,
  TrendingUp,
  Tag,
  Check,
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/nexus/toast-provider'

export interface AuditEventItem {
  id: string
  ticketId: string
  ticketTitle: string
  ticketPriority: string
  ticketService: string
  currentStatus: string
  action: 'creacion' | 'cambio_estado' | 'asignacion' | 'edicion' | 'cierre'
  previousStatus: string | null
  newStatus: string | null
  previousAssignee: string | null
  newAssignee: string | null
  actorName: string
  actorEmail: string | null
  details: string
  createdAt: string
  durationSeconds: number
  metadata: Record<string, any>
}

export default function AuditLogsPage() {
  const { success, error, info } = useToast()

  const [events, setEvents] = useState<AuditEventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [selectedActor, setSelectedActor] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [showIndividualModal, setShowIndividualModal] = useState(false)

  // Cargar eventos de auditoría desde la API
  const fetchAuditEvents = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/audit-logs?limit=300')
      if (!res.ok) throw new Error('Error al cargar la auditoría')
      const data = await res.json()
      setEvents(data)
    } catch (err: any) {
      console.error(err)
      error('Error al cargar eventos', err.message || 'No se pudo obtener la trazabilidad.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditEvents()
  }, [])

  // Lista única de actores/usuarios para el filtro
  const uniqueActors = useMemo(() => {
    const actors = new Set<string>()
    events.forEach((e) => {
      if (e.actorName) actors.add(e.actorName)
    })
    return Array.from(actors)
  }, [events])

  // Filtrado de eventos
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        e.ticketId.toLowerCase().includes(query) ||
        e.ticketTitle.toLowerCase().includes(query) ||
        e.actorName.toLowerCase().includes(query) ||
        e.details.toLowerCase().includes(query)

      const matchesAction = selectedAction === 'all' || e.action === selectedAction
      const matchesActor = selectedActor === 'all' || e.actorName === selectedActor
      const matchesStatus =
        selectedStatus === 'all' ||
        e.newStatus === selectedStatus ||
        e.currentStatus === selectedStatus

      return matchesSearch && matchesAction && matchesActor && matchesStatus
    })
  }, [events, searchQuery, selectedAction, selectedActor, selectedStatus])

  // Métricas globales de auditoría
  const metrics = useMemo(() => {
    const totalEvents = events.length
    const uniqueTickets = new Set(events.map((e) => e.ticketId)).size
    const statusChanges = events.filter((e) => e.action === 'cambio_estado').length
    const closedTickets = events.filter((e) => e.action === 'cierre').length

    return { totalEvents, uniqueTickets, statusChanges, closedTickets }
  }, [events])

  // Formateador de fechas en español
  const formatDateTime = (isoString: string) => {
    if (!isoString) return 'N/A'
    try {
      const d = new Date(isoString)
      if (isNaN(d.getTime())) return isoString
      return d.toLocaleString('es-CL', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  // Formateador de duración en segundos a texto legible
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return 'Inmediato'
    const mins = Math.floor(seconds / 60)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${mins % 60}m`
    return `${mins}m`
  }

  // Traducción y badges de estado
  const getStatusBadge = (status: string | null) => {
    if (!status) return null
    switch (status) {
      case 'Open':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Pendiente</span>
      case 'In Progress':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">En Proceso</span>
      case 'Blocked':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">En Revisión</span>
      case 'Resolved':
      case 'Closed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Resuelto / Cerrado</span>
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-secondary text-foreground">{status}</span>
    }
  }

  // Traducción y badges de acción
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'creacion':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Sparkles className="size-3" />
            Creación
          </span>
        )
      case 'cambio_estado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
            <Activity className="size-3" />
            Cambio de Estado
          </span>
        )
      case 'asignacion':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-500/10 text-violet-500 border border-violet-500/20">
            <User className="size-3" />
            Asignación
          </span>
        )
      case 'cierre':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="size-3" />
            Cierre Definitivo
          </span>
        )
      case 'edicion':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <FileText className="size-3" />
            Edición
          </span>
        )
      default:
        return <span className="text-xs text-muted-foreground">{action}</span>
    }
  }

  // Exportar auditoría a CSV
  const handleExportCSV = () => {
    if (filteredEvents.length === 0) {
      info('Sin datos', 'No hay eventos de auditoría para exportar.')
      return
    }

    const headers = ['Fecha y Hora', 'Ticket ID', 'Titulo', 'Usuario', 'Accion', 'Estado Anterior', 'Estado Nuevo', 'Detalles', 'Duracion Segundos']
    const rows = filteredEvents.map((e) => [
      formatDateTime(e.createdAt),
      e.ticketId,
      `"${(e.ticketTitle || '').replace(/"/g, '""')}"`,
      `"${(e.actorName || '').replace(/"/g, '""')}"`,
      e.action,
      e.previousStatus || '',
      e.newStatus || '',
      `"${(e.details || '').replace(/"/g, '""')}"`,
      e.durationSeconds || 0,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `auditoria_tickets_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    success('Exportación Exitosa', 'El archivo CSV de auditoría ha sido generado.')
  }

  // Abrir vista individual con gráficos
  const handleOpenIndividualTraceability = (ticketId: string) => {
    setSelectedTicketId(ticketId)
    setShowIndividualModal(true)
  }

  // Eventos filtrados para el ticket seleccionado en la vista individual
  const ticketEvents = useMemo(() => {
    if (!selectedTicketId) return []
    return events
      .filter((e) => e.ticketId === selectedTicketId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [events, selectedTicketId])

  // Datos para los gráficos de la vista individual
  const individualTicketData = useMemo(() => {
    if (!selectedTicketId || ticketEvents.length === 0) return null

    const firstEvent = ticketEvents[0]
    const lastEvent = ticketEvents[ticketEvents.length - 1]
    const isClosed = ticketEvents.some((e) => e.action === 'cierre' || e.newStatus === 'Resolved')

    // Cálculo de tiempo en cada estado
    const stateTimes: Record<string, number> = {
      Open: 0,
      'In Progress': 0,
      Blocked: 0,
      Resolved: 0,
    }

    for (let i = 0; i < ticketEvents.length; i++) {
      const current = ticketEvents[i]
      const next = ticketEvents[i + 1]
      const stateKey = current.newStatus || current.previousStatus || 'Open'

      if (next) {
        const diffSecs = Math.max(0, Math.floor((new Date(next.createdAt).getTime() - new Date(current.createdAt).getTime()) / 1000))
        if (stateTimes[stateKey] !== undefined) {
          stateTimes[stateKey] += diffSecs
        } else {
          stateTimes[stateKey] = diffSecs
        }
      } else {
        // Para el último estado hasta ahora (si no está cerrado)
        const diffSecs = isClosed ? 0 : Math.max(0, Math.floor((Date.now() - new Date(current.createdAt).getTime()) / 1000))
        if (stateTimes[stateKey] !== undefined) {
          stateTimes[stateKey] += diffSecs
        }
      }
    }

    const totalLifecycleSecs = Math.max(
      60,
      Math.floor((new Date(lastEvent.createdAt).getTime() - new Date(firstEvent.createdAt).getTime()) / 1000)
    )

    // Tiempo hasta primera atención (desde creación hasta asignación o primer cambio de estado)
    let firstResponseSecs: number | null = null
    const firstAttention = ticketEvents.find((e) => e.action === 'asignacion' || (e.action === 'cambio_estado' && e.newStatus !== 'Open'))
    if (firstAttention) {
      firstResponseSecs = Math.max(
        0,
        Math.floor((new Date(firstAttention.createdAt).getTime() - new Date(firstEvent.createdAt).getTime()) / 1000)
      )
    }

    return {
      ticketId: selectedTicketId,
      title: firstEvent.ticketTitle,
      service: firstEvent.ticketService,
      priority: firstEvent.ticketPriority,
      currentStatus: lastEvent.newStatus || firstEvent.currentStatus,
      creator: firstEvent.actorName,
      assignee: lastEvent.newAssignee || 'Equipo TI',
      totalEvents: ticketEvents.length,
      createdAt: firstEvent.createdAt,
      closedAt: isClosed ? lastEvent.createdAt : null,
      totalLifecycleSecs,
      firstResponseSecs,
      stateTimes,
    }
  }, [ticketEvents, selectedTicketId])

  return (
    <div className="w-full flex flex-col gap-6 pb-20">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="size-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-sm">
              <Shield className="size-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Módulo de Auditoría & Trazabilidad
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                  Desarrollo TI - Lander Inmobiliaria
                </span>
              </h1>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Registro cronológico inmutable del ciclo de vida de los tickets: creación, asignaciones y cambios de estado con usuario, fecha y hora.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAuditEvents}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-border bg-card hover:bg-secondary text-foreground transition shadow-sm"
            title="Refrescar auditoría"
          >
            <RotateCcw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
          >
            <Download className="size-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPIs de Auditoría General */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="nexus-glass-card rounded-xl border border-border/70 p-4 bg-card shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total de Eventos</span>
            <div className="size-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Layers className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-2">{metrics.totalEvents}</div>
          <span className="text-[11px] text-muted-foreground">Acciones registradas</span>
        </div>

        <div className="nexus-glass-card rounded-xl border border-border/70 p-4 bg-card shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tickets Auditados</span>
            <div className="size-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <Tag className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-500 mt-2">{metrics.uniqueTickets}</div>
          <span className="text-[11px] text-muted-foreground">Tickets con trazabilidad</span>
        </div>

        <div className="nexus-glass-card rounded-xl border border-border/70 p-4 bg-card shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Cambios de Estado</span>
            <div className="size-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Activity className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-500 mt-2">{metrics.statusChanges}</div>
          <span className="text-[11px] text-muted-foreground">Transiciones operativas</span>
        </div>

        <div className="nexus-glass-card rounded-xl border border-border/70 p-4 bg-card shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Cierres y Resoluciones</span>
            <div className="size-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-500 mt-2">{metrics.closedTickets}</div>
          <span className="text-[11px] text-muted-foreground">Tickets resueltos auditados</span>
        </div>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="nexus-glass-card rounded-xl border border-border/80 p-4 bg-card/60 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Buscador */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por ticket (#NX-XXXX), usuario, título o detalle..."
              className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
            />
          </div>

          {/* Filtro por Acción */}
          <div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
            >
              <option value="all">Todas las Acciones</option>
              <option value="creacion">Creación de Ticket</option>
              <option value="cambio_estado">Cambio de Estado</option>
              <option value="asignacion">Asignación de Técnico</option>
              <option value="cierre">Cierre Definitivo</option>
              <option value="edicion">Modificación de Datos</option>
            </select>
          </div>

          {/* Filtro por Usuario / Actor */}
          <div>
            <select
              value={selectedActor}
              onChange={(e) => setSelectedActor(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
            >
              <option value="all">Todos los Usuarios</option>
              {uniqueActors.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Trazabilidad General */}
      <div className="nexus-glass-card rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 text-muted-foreground border-b border-border/80 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Usuario Responsable</th>
                <th className="py-3 px-4">Acción Realizada</th>
                <th className="py-3 px-4">Transición / Detalle</th>
                <th className="py-3 px-4">Permanencia</th>
                <th className="py-3 px-4 text-right">Trazabilidad Individual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="size-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                      <span>Cargando trazabilidad de tickets...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No se encontraron registros de auditoría que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-secondary/30 transition-colors">
                    {/* Fecha y Hora */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3 text-muted-foreground shrink-0" />
                        <span>{formatDateTime(evt.createdAt)}</span>
                      </div>
                    </td>

                    {/* Ticket */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md text-[11px]">
                          {evt.ticketId}
                        </span>
                        <span className="max-w-[180px] truncate text-foreground font-medium text-xs" title={evt.ticketTitle}>
                          {evt.ticketTitle}
                        </span>
                      </div>
                    </td>

                    {/* Usuario Actor */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                          {evt.actorName
                            ? evt.actorName
                                .split(' ')
                                .map((p) => p[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()
                            : 'OP'}
                        </div>
                        <span className="text-foreground font-semibold">{evt.actorName}</span>
                      </div>
                    </td>

                    {/* Acción */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(evt.action)}
                    </td>

                    {/* Transición o Detalle */}
                    <td className="py-3 px-4">
                      {evt.action === 'cambio_estado' ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {getStatusBadge(evt.previousStatus)}
                          <ArrowRight className="size-3 text-muted-foreground" />
                          {getStatusBadge(evt.newStatus)}
                        </div>
                      ) : evt.action === 'asignacion' ? (
                        <div className="text-xs text-foreground">
                          <span className="text-muted-foreground">{evt.previousAssignee || 'Sin Asignar'}</span> ➔ <strong className="text-violet-500">{evt.newAssignee}</strong>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground truncate max-w-[280px] block" title={evt.details}>
                          {evt.details}
                        </span>
                      )}
                    </td>

                    {/* Permanencia */}
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground font-mono">
                      {evt.durationSeconds > 0 ? formatDuration(evt.durationSeconds) : '—'}
                    </td>

                    {/* Botón Trazabilidad Individual con Gráficos */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenIndividualTraceability(evt.ticketId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 transition shadow-sm"
                      >
                        <BarChart3 className="size-3.5" />
                        <span>Ver con Gráficos</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VISTA INDIVIDUAL DEL TICKET CON GRÁFICOS INTERACTIVOS */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showIndividualModal && individualTicketData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-background/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="nexus-glass-card rounded-2xl border border-border/80 bg-card p-6 shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto space-y-6"
            >
              {/* Encabezado del Modal Individual */}
              <div className="flex items-center justify-between border-b border-border/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shadow-sm">
                    <BarChart3 className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                        {individualTicketData.ticketId}
                      </span>
                      <h2 className="text-base font-bold text-foreground">
                        {individualTicketData.title}
                      </h2>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Trazabilidad completa de ciclo de vida con gráficos interactivos y registro de tiempos
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/incidents/${encodeURIComponent(individualTicketData.ticketId.replace('#', ''))}`}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-secondary hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-border transition"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>Abrir Ticket</span>
                  </Link>
                  <button
                    onClick={() => setShowIndividualModal(false)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              {/* Ficha Resumen del Ticket */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-secondary/30 border border-border/60 rounded-xl p-3 text-xs">
                <div>
                  <span className="text-[11px] text-muted-foreground">Estado Actual:</span>
                  <div className="mt-1">{getStatusBadge(individualTicketData.currentStatus)}</div>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">Área / Servicio:</span>
                  <div className="font-semibold text-foreground mt-1">{individualTicketData.service}</div>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">Creado por:</span>
                  <div className="font-semibold text-foreground mt-1">{individualTicketData.creator}</div>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">Responsable:</span>
                  <div className="font-semibold text-foreground mt-1">{individualTicketData.assignee}</div>
                </div>
              </div>

              {/* GRÁFICO 1: Métricas y Tiempos de Rendimiento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="nexus-glass-card rounded-xl border border-border/80 p-4 bg-card/60 shadow-sm">
                  <div className="flex items-center justify-between text-muted-foreground mb-2">
                    <span className="text-xs font-semibold">Tiempo Primera Atención</span>
                    <Clock className="size-4 text-cyan-500" />
                  </div>
                  <div className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
                    {individualTicketData.firstResponseSecs !== null
                      ? formatDuration(individualTicketData.firstResponseSecs)
                      : 'En espera'}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Desde creación hasta inicio de atención</p>
                </div>

                <div className="nexus-glass-card rounded-xl border border-border/80 p-4 bg-card/60 shadow-sm">
                  <div className="flex items-center justify-between text-muted-foreground mb-2">
                    <span className="text-xs font-semibold">Ciclo de Vida Total</span>
                    <TrendingUp className="size-4 text-emerald-500" />
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatDuration(individualTicketData.totalLifecycleSecs)}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {individualTicketData.closedAt ? 'Tiempo total hasta resolución final' : 'Tiempo acumulado en curso'}
                  </p>
                </div>

                <div className="nexus-glass-card rounded-xl border border-border/80 p-4 bg-card/60 shadow-sm">
                  <div className="flex items-center justify-between text-muted-foreground mb-2">
                    <span className="text-xs font-semibold">Total Modificaciones</span>
                    <Layers className="size-4 text-violet-500" />
                  </div>
                  <div className="text-xl font-bold font-mono text-violet-600 dark:text-violet-400">
                    {individualTicketData.totalEvents} eventos
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Intervenciones y cambios auditados</p>
                </div>
              </div>

              {/* GRÁFICO 2: Barra Visual de Permanencia por Estado */}
              <div className="nexus-glass-card rounded-xl border border-border/80 p-5 bg-card/60 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="size-4 text-cyan-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Gráfico de Permanencia por Estado
                    </h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Distribución del tiempo de vida</span>
                </div>

                {/* Barra segmentada visual */}
                <div className="w-full h-4 rounded-full bg-secondary overflow-hidden flex shadow-inner">
                  {Object.entries(individualTicketData.stateTimes).map(([state, secs]) => {
                    const pct = individualTicketData.totalLifecycleSecs > 0
                      ? Math.max(secs > 0 ? 5 : 0, Math.round((secs / individualTicketData.totalLifecycleSecs) * 100))
                      : 0
                    if (secs <= 0) return null

                    let bgClass = 'bg-amber-500'
                    if (state === 'In Progress') bgClass = 'bg-cyan-500'
                    if (state === 'Blocked') bgClass = 'bg-violet-500'
                    if (state === 'Resolved' || state === 'Closed') bgClass = 'bg-emerald-500'

                    return (
                      <div
                        key={state}
                        style={{ width: `${pct}%` }}
                        className={`${bgClass} transition-all duration-500 relative group`}
                        title={`${state}: ${formatDuration(secs)} (${pct}%)`}
                      />
                    )
                  })}
                </div>

                {/* Leyenda y tiempos exactos */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="flex flex-col p-2.5 rounded-lg bg-secondary/40 border border-border/40">
                    <span className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                      <span className="size-2 rounded-full bg-amber-500" />
                      Pendiente
                    </span>
                    <span className="font-mono text-sm font-bold text-foreground mt-1">
                      {formatDuration(individualTicketData.stateTimes.Open || 0)}
                    </span>
                  </div>

                  <div className="flex flex-col p-2.5 rounded-lg bg-secondary/40 border border-border/40">
                    <span className="flex items-center gap-1.5 text-xs text-cyan-500 font-semibold">
                      <span className="size-2 rounded-full bg-cyan-500" />
                      En Proceso
                    </span>
                    <span className="font-mono text-sm font-bold text-foreground mt-1">
                      {formatDuration(individualTicketData.stateTimes['In Progress'] || 0)}
                    </span>
                  </div>

                  <div className="flex flex-col p-2.5 rounded-lg bg-secondary/40 border border-border/40">
                    <span className="flex items-center gap-1.5 text-xs text-violet-500 font-semibold">
                      <span className="size-2 rounded-full bg-violet-500" />
                      En Revisión
                    </span>
                    <span className="font-mono text-sm font-bold text-foreground mt-1">
                      {formatDuration(individualTicketData.stateTimes.Blocked || 0)}
                    </span>
                  </div>

                  <div className="flex flex-col p-2.5 rounded-lg bg-secondary/40 border border-border/40">
                    <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      Resuelto / Cerrado
                    </span>
                    <span className="font-mono text-sm font-bold text-foreground mt-1">
                      {formatDuration(individualTicketData.stateTimes.Resolved || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* GRÁFICO 3: Flujograma Cronológico de Ciclo de Vida (Stepper) */}
              <div className="nexus-glass-card rounded-xl border border-border/80 p-5 bg-card/60 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="size-4 text-cyan-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Flujograma de Trazabilidad & Cambios de Estado
                    </h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {ticketEvents.length} hitos registrados
                  </span>
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-violet-500 before:to-emerald-500">
                  {ticketEvents.map((evt, idx) => {
                    let dotColor = 'bg-cyan-500 ring-cyan-500/20'
                    if (evt.action === 'creacion') dotColor = 'bg-blue-500 ring-blue-500/20'
                    if (evt.action === 'asignacion') dotColor = 'bg-violet-500 ring-violet-500/20'
                    if (evt.action === 'cierre' || evt.newStatus === 'Resolved') dotColor = 'bg-emerald-500 ring-emerald-500/20'

                    return (
                      <div key={evt.id} className="relative group">
                        {/* Nodo Circular */}
                        <div className={`absolute -left-6 top-1 size-3 rounded-full ${dotColor} ring-4 ring-background shadow-md`} />

                        {/* Tarjeta del Hito */}
                        <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/70 hover:border-cyan-500/40 transition">
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                            <div className="flex items-center gap-2">
                              {getActionBadge(evt.action)}
                              <span className="text-xs font-bold text-foreground">{evt.details}</span>
                            </div>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {formatDateTime(evt.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/30 mt-2">
                            <div className="flex items-center gap-1.5">
                              <User className="size-3.5 text-cyan-500" />
                              <span>Usuario responsable: <strong className="text-foreground">{evt.actorName}</strong></span>
                            </div>

                            {evt.durationSeconds > 0 && (
                              <div className="flex items-center gap-1 text-[11px] font-mono text-amber-500">
                                <Clock className="size-3" />
                                <span>Tiempo en estado previo: {formatDuration(evt.durationSeconds)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Botones del Pie del Modal */}
              <div className="flex items-center justify-between border-t border-border/80 pt-4">
                <span className="text-xs text-muted-foreground font-mono">
                  Trazabilidad verificada por Desarrollo TI - Lander Inmobiliaria
                </span>
                <button
                  onClick={() => setShowIndividualModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground transition"
                >
                  Cerrar Trazabilidad
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
