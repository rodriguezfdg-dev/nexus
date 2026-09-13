'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Sparkles,
  Shield,
  CheckCircle2,
  Filter,
  Flame,
  UserCheck,
  Zap,
  ArrowRight,
  RotateCcw,
  Check,
  ChevronRight,
  Tag,
  UserPlus,
  Search,
  X
} from 'lucide-react'
import { EmptyState } from '@/components/nexus/empty-state'
import { useNexusData, Incident } from '@/lib/data-context'

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low'
export type ServiceTag = string

export interface Ticket {
  id: string
  title: string
  priority: Priority
  service: string
  env: 'Production' | 'Staging' | 'Edge'
  assignee: {
    name: string
    initials: string
    status: 'online' | 'busy' | 'ai'
  }
  slaSecondsInitial: number
  aiTriaged: boolean
  assignedToMe: boolean
  tag: string
  createdTime: string
}

export const initialTickets: Ticket[] = []

type TabId = 'all' | 'critical' | 'assigned' | 'ai-triaged'

export function TicketFeed() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { incidents, loading, updateIncident, deleteIncident } = useNexusData()

  // Read state from URL query parameters
  const activeTab = (searchParams.get('tab') as TabId) || 'all'
  const filterEnv = searchParams.get('env') || 'all'
  const filterPriority = searchParams.get('priority') || 'all'
  const filterTag = searchParams.get('tag') || 'all'

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Map incidents from SQLite to Ticket structure
  const tickets: Ticket[] = incidents
    .filter((inc) => inc.status !== 'Resolved')
    .map((inc) => ({
      id: inc.id,
      title: inc.title,
      priority: inc.priority,
      service: inc.service,
      env: inc.env,
      assignee: inc.assignee,
      slaSecondsInitial: inc.slaSecondsRemaining,
      aiTriaged: inc.aiTriaged,
      assignedToMe: inc.assignedToMe,
      tag: inc.tag,
      createdTime: inc.createdTime,
    }))

  const tabs: { id: TabId; label: string; countBadge?: number }[] = [
    { id: 'all', label: 'Todos los Tickets', countBadge: tickets.length },
    {
      id: 'critical',
      label: 'Críticos (P1)',
      countBadge: tickets.filter((t) => t.priority === 'Critical').length,
    },
    {
      id: 'assigned',
      label: 'Asignados a Mí',
      countBadge: tickets.filter((t) => t.assignedToMe).length,
    },
    {
      id: 'ai-triaged',
      label: 'Triados por IA',
      countBadge: tickets.filter((t) => t.aiTriaged).length,
    },
  ]

  // Helper to update query parameters smoothly
  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    const queryStr = params.toString()
    router.replace(queryStr ? `${pathname}?${queryStr}` : pathname, { scroll: false })
  }

  const handleTabChange = (tabId: TabId) => {
    updateQuery('tab', tabId)
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    router.replace(pathname, { scroll: false })
  }

  // Quick Action Handlers connected to SQLite
  const handleResolve = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    await updateIncident(id, { status: 'Resolved' })
    setToastMessage(`Incident ${id} marked as RESOLVED in SQLite.`)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handleEscalate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    await updateIncident(id, { priority: 'Critical', slaSecondsRemaining: 600 })
    setToastMessage(`Incident ${id} escalated to Critical P1 in SQLite.`)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handleAssign = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    await updateIncident(id, {
      assignedToMe: true,
      assignee: { name: 'Operador Principal', initials: 'OP', status: 'busy' },
    })
    setToastMessage(`Incident ${id} assigned to Operador Principal in SQLite.`)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Filter evaluation
  const filteredTickets = tickets.filter((t) => {
    // Search keyword
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim()
      const matches =
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.service.toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q)
      if (!matches) return false
    }

    // 1. Tab Filter
    if (activeTab === 'critical' && t.priority !== 'Critical') return false
    if (activeTab === 'assigned' && !t.assignedToMe) return false
    if (activeTab === 'ai-triaged' && !t.aiTriaged) return false

    // 2. Environment Filter
    if (filterEnv !== 'all' && t.env.toLowerCase() !== filterEnv.toLowerCase()) return false

    // 3. Priority Filter
    if (filterPriority !== 'all' && t.priority.toLowerCase() !== filterPriority.toLowerCase()) return false

    // 4. Tag Filter
    if (filterTag !== 'all' && t.tag.toLowerCase() !== filterTag.toLowerCase()) return false

    return true
  })

  // Format SLA countdown (mm:ss or hh:mm:ss)
  const formatSla = (secs: number) => {
    const hours = Math.floor(secs / 3600)
    const minutes = Math.floor((secs % 3600) / 60)
    const seconds = secs % 60

    if (hours > 0) {
      return `${hours}h ${String(minutes).padStart(2, '0')}m`
    }
    return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
  }

  // SLA Color: Red (<15m), Amber (15m-30m), Green (>30m)
  const getSlaVisuals = (secs: number) => {
    if (secs < 900) {
      // < 15 mins
      return {
        text: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-500/10 border-rose-500/30',
        glow: 'shadow-[0_0_8px_rgba(244,63,94,0.3)]',
        pulse: true,
      }
    }
    if (secs < 1800) {
      // 15m - 30m
      return {
        text: 'text-amber-700 dark:text-[#F5BA67]',
        bg: 'bg-amber-500/10 border-amber-500/30',
        glow: 'shadow-[0_0_8px_rgba(245,186,103,0.25)]',
        pulse: false,
      }
    }
    // > 30 mins
    return {
      text: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      glow: '',
      pulse: false,
    }
  }

  const hasActiveFilters =
    filterEnv !== 'all' ||
    filterPriority !== 'all' ||
    filterTag !== 'all' ||
    activeTab !== 'all' ||
    searchTerm.trim().length > 0

  return (
    <div className="w-full flex flex-col gap-5 mt-4">
      
      {/* Action Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex items-center gap-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-xs text-cyan-700 dark:text-cyan-300 shadow-lg backdrop-blur-xl"
          >
            <Check className="size-4 text-cyan-500 shrink-0" />
            <span className="font-mono">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Redesigned Control Bar: Balanced 2-Tier Architecture */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/60 dark:bg-zinc-950/50 p-3.5 backdrop-blur-md shadow-sm">
        
        {/* Tier 1: View Navigation (Segmented Tabs) + Instant Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented Tab Bar */}
          <div className="flex items-center gap-1 p-1 bg-secondary/60 dark:bg-zinc-900/70 rounded-xl border border-border/50 overflow-x-auto scrollbar-none">
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.id
              const count = tab.countBadge ?? 0
              const showBadge = count > 0

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 select-none shrink-0 ${
                    isSelected
                      ? 'text-cyan-700 dark:text-cyan-300 bg-background dark:bg-zinc-800 shadow-sm border border-border/70'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
                  }`}
                >
                  <span>{tab.label}</span>

                  {showBadge && (
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Quick Search Input */}
          <div className="relative flex items-center min-w-[240px] md:w-72">
            <Search className="size-3.5 text-muted-foreground absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por ID, título, servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/80 pl-8.5 pr-8 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:outline-none transition shadow-sm font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 text-muted-foreground hover:text-foreground p-0.5"
                title="Limpiar búsqueda"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: Dedicated Filter Controls (Environment, Priority, Tag, Reset & Counts) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-border/40">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
              <Filter className="size-3.5 text-cyan-500" />
              <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Filtros:</span>
            </div>

            {/* Environment Filter */}
            <select
              value={filterEnv}
              onChange={(e) => updateQuery('env', e.target.value)}
              className="h-8 rounded-lg border border-border bg-background/80 hover:bg-background px-2.5 text-xs text-foreground outline-none focus:border-cyan-500 transition shadow-sm font-medium cursor-pointer"
              title="Filtrar por Entorno"
            >
              <option value="all">Entorno: Todos</option>
              <option value="production">Producción</option>
              <option value="staging">Staging / Pruebas</option>
              <option value="edge">Nodos Edge</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => updateQuery('priority', e.target.value)}
              className="h-8 rounded-lg border border-border bg-background/80 hover:bg-background px-2.5 text-xs text-foreground outline-none focus:border-cyan-500 transition shadow-sm font-medium cursor-pointer"
              title="Filtrar por Prioridad"
            >
              <option value="all">Prioridad: Todas</option>
              <option value="critical">Crítica (P1)</option>
              <option value="high">Alta (P2)</option>
              <option value="medium">Media (P3)</option>
              <option value="low">Baja (P4)</option>
            </select>

            {/* Tag Filter */}
            <select
              value={filterTag}
              onChange={(e) => updateQuery('tag', e.target.value)}
              className="h-8 rounded-lg border border-border bg-background/80 hover:bg-background px-2.5 text-xs text-foreground outline-none focus:border-cyan-500 transition shadow-sm font-medium cursor-pointer"
              title="Filtrar por Etiqueta"
            >
              <option value="all">Etiqueta: Todas</option>
              <option value="database">Base de Datos</option>
              <option value="security">Seguridad</option>
              <option value="streaming">Streaming</option>
              <option value="kubernetes">Kubernetes</option>
              <option value="networking">Redes</option>
              <option value="billing">Facturación</option>
            </select>

            {/* Reset Filters button if any filter applied */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="h-8 flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 transition"
                title="Restablecer todos los filtros"
              >
                <RotateCcw className="size-3" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>

          {/* Real-time Matching Counter */}
          <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
            <span>Mostrando <strong className="text-foreground">{filteredTickets.length}</strong> de {tickets.length} incidentes</span>
          </div>
        </div>
      </div>

      {/* Ticket Cards Grid with Framer Motion Layout Animation */}
      {filteredTickets.length > 0 ? (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTickets.map((ticket) => {
              const sla = getSlaVisuals(ticket.slaSecondsInitial)

              return (
                <motion.div
                  key={ticket.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.22 }}
                  className="nexus-glass-card rounded-2xl p-4 flex flex-col justify-between group hover:border-cyan-500/40 relative overflow-hidden transition-colors"
                >
                  {/* Top Row: ID, Priority, SLA Countdown */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/incidents/${ticket.id.replace('#', '')}`}
                          className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
                        >
                          {ticket.id}
                        </Link>

                        {/* Priority Badge */}
                        <span
                          className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            ticket.priority === 'Critical'
                              ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : ticket.priority === 'High'
                              ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                              : ticket.priority === 'Medium'
                              ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                              : 'border-border bg-muted text-muted-foreground'
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </div>

                      {/* Animated SLA Countdown */}
                      <div
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-mono text-[11px] font-semibold ${sla.bg} ${sla.text} ${sla.glow}`}
                      >
                        <Clock className={`size-3 ${sla.pulse ? 'animate-spin' : ''}`} />
                        <span>{formatSla(ticket.slaSecondsInitial)}</span>
                      </div>
                    </div>

                    {/* Title & Service Tag Chip */}
                    <Link
                      href={`/incidents/${ticket.id.replace('#', '')}`}
                      className="block mt-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors"
                    >
                      <h3 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                        {ticket.title}
                      </h3>
                    </Link>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {/* Service Tag Chip */}
                      <span className="font-mono text-[10px] font-medium px-2 py-0.5 rounded-md border border-border bg-secondary text-muted-foreground">
                        {ticket.service}
                      </span>

                      {/* Env Tag */}
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-md border border-border/80 bg-muted/60 text-muted-foreground">
                        {ticket.env}
                      </span>

                      {/* AI Triaged Tag */}
                      {ticket.aiTriaged && (
                        <span className="flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded-md border border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300">
                          <Sparkles className="size-2.5" /> AI Triaged
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Row: Assignee Avatar + Hover Quick Actions */}
                  <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    
                    {/* Assignee Avatar with status dot */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary border border-border text-[10px] font-mono font-bold text-foreground">
                        {ticket.assignee.initials}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 size-2 rounded-full ring-1 ring-background ${
                            ticket.assignee.status === 'online'
                              ? 'bg-emerald-500'
                              : ticket.assignee.status === 'busy'
                              ? 'bg-amber-500'
                              : 'bg-cyan-500'
                          }`}
                        />
                      </div>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {ticket.assignee.name}
                      </span>
                    </div>

                    {/* Quick Actions (Reveal on Card Hover) */}
                    <div className="flex items-center gap-1 transition-opacity opacity-80 group-hover:opacity-100">
                      {ticket.priority !== 'Critical' && (
                        <button
                          onClick={(e) => handleEscalate(e, ticket.id)}
                          className="p-1 rounded-md border border-border bg-card hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500 text-muted-foreground transition"
                          title="Escalate to Critical P1"
                        >
                          <Flame className="size-3.5" />
                        </button>
                      )}

                      {!ticket.assignedToMe && (
                        <button
                          onClick={(e) => handleAssign(e, ticket.id)}
                          className="p-1 rounded-md border border-border bg-card hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-500 text-muted-foreground transition"
                          title="Assign to Me (Alex Thorne)"
                        >
                          <UserPlus className="size-3.5" />
                        </button>
                      )}

                      <button
                        onClick={(e) => handleResolve(e, ticket.id)}
                        className="p-1 rounded-md border border-border bg-card hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-500 text-muted-foreground transition"
                        title="Mark as Resolved"
                      >
                        <CheckCircle2 className="size-3.5" />
                      </button>
                    </div>

                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={Shield}
          badgeTone="emerald"
          badgeText="SISTEMA LIMPIO"
          title="No hay incidentes activos en SQLite"
          description="La base de datos SQLite está lista para recibir los datos reales de tu infraestructura y equipo. Puedes crear un incidente nuevo o utilizar la herramienta de migración."
          action={{
            label: 'Restablecer Filtros',
            icon: RotateCcw,
            onClick: clearAllFilters,
          }}
          className="my-6"
        />
      ) : (
        /* Reusable Empty State with floating/pulsing animated icon */
        <EmptyState
          icon={Filter}
          badgeTone="cyan"
          badgeText={`SCOPE: ${activeTab.toUpperCase()}`}
          title="No incidents match the active filters"
          description={`No operational tickets found for tab "${activeTab}" with the current environment or priority scope.`}
          action={{
            label: 'Clear All Active Filters',
            icon: RotateCcw,
            onClick: clearAllFilters,
          }}
          className="my-6"
        />
      )}

    </div>
  )
}
