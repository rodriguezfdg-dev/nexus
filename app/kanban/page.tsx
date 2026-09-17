'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Filter,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  Tag,
  SlidersHorizontal,
  Flame,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Paperclip,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
} from 'lucide-react'
import { useNexusData, Incident, IncidentStatus, Priority } from '@/lib/data-context'
import { useToast } from '@/components/nexus/toast-provider'

interface ColumnDef {
  id: IncidentStatus
  title: string
  color: string
  borderColor: string
  badgeBg: string
  dotColor: string
}

const COLUMNS: ColumnDef[] = [
  {
    id: 'Open',
    title: 'Pendientes',
    color: 'text-amber-500',
    borderColor: 'border-amber-500/30',
    badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'In Progress',
    title: 'En Proceso',
    color: 'text-cyan-500',
    borderColor: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    dotColor: 'bg-cyan-500',
  },
  {
    id: 'Blocked',
    title: 'En Revisión',
    color: 'text-violet-500',
    borderColor: 'border-violet-500/30',
    badgeBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    dotColor: 'bg-violet-500',
  },
  {
    id: 'Resolved',
    title: 'Cerrados / Resueltos',
    color: 'text-emerald-500',
    borderColor: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
  },
]

export default function KanbanPage() {
  const { incidents, sections, usersList, assignableUsers, updateIncident, deleteIncident, refresh, loading } = useNexusData()
  const { success, info, error } = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSection, setSelectedSection] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<Incident | null>(null)

  // Edit in modal state
  const [isEditingInModal, setIsEditingInModal] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editPriority, setEditPriority] = useState<Priority>('Medium')
  const [editStatus, setEditStatus] = useState<IncidentStatus>('Open')
  const [editService, setEditService] = useState('')
  const [editAssignee, setEditAssignee] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const handleStartEdit = (ticket: Incident) => {
    setEditTitle(ticket.title)
    setEditPriority(ticket.priority)
    setEditStatus(ticket.status)
    setEditService(ticket.service)
    setEditAssignee(ticket.assignee.name)
    setIsEditingInModal(true)
  }

  const handleSaveModalEdit = async () => {
    if (!selectedTicketDetail || !editTitle.trim()) return
    setIsSavingEdit(true)
    try {
      const selectedUser = usersList.find((u) => u.name === editAssignee)
      const initials = editAssignee
        ? editAssignee.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
        : 'UN'

      await updateIncident(selectedTicketDetail.id, {
        title: editTitle.trim(),
        priority: editPriority,
        status: editStatus,
        service: editService,
        tag: editService,
        assignee: {
          name: editAssignee || 'Sin Asignar',
          initials,
          status: 'online',
        },
      })

      setSelectedTicketDetail((prev) =>
        prev
          ? {
              ...prev,
              title: editTitle.trim(),
              priority: editPriority,
              status: editStatus,
              service: editService,
              tag: editService,
              assignee: {
                name: editAssignee || 'Sin Asignar',
                initials,
                status: 'online',
              },
            }
          : null
      )

      setIsEditingInModal(false)
      success('Ticket Actualizado', `El ticket ${selectedTicketDetail.id} fue modificado exitosamente.`)
    } catch (err: any) {
      error('Error al Guardar', err.message || 'No se pudo actualizar el ticket.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Filtered tickets
  const filteredIncidents = useMemo(() => {
    return incidents.filter((ticket) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesQuery =
          ticket.id.toLowerCase().includes(q) ||
          ticket.title.toLowerCase().includes(q) ||
          ticket.assignee.name.toLowerCase().includes(q) ||
          ticket.service.toLowerCase().includes(q) ||
          ticket.tag.toLowerCase().includes(q)
        if (!matchesQuery) return false
      }

      // Section
      if (selectedSection !== 'all') {
        if (ticket.service !== selectedSection && ticket.tag !== selectedSection) {
          return false
        }
      }

      // Priority
      if (selectedPriority !== 'all') {
        if (ticket.priority !== selectedPriority) {
          return false
        }
      }

      return true
    })
  }, [incidents, searchQuery, selectedSection, selectedPriority])

  const handleStatusChange = async (ticketId: string, newStatus: IncidentStatus) => {
    setUpdatingId(ticketId)
    try {
      await updateIncident(ticketId, { status: newStatus })
      success('Estado Actualizado', `El ticket ${ticketId} ahora está en "${newStatus}".`)
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-500 font-semibold">
            <Flame className="size-3" />
            Crítica
          </span>
        )
      case 'High':
        return (
          <span className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-500 font-semibold">
            <AlertCircle className="size-3" />
            Alta
          </span>
        )
      case 'Medium':
        return (
          <span className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-500 font-semibold">
            Media
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-semibold">
            Baja
          </span>
        )
    }
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex size-2 rounded-full bg-cyan-500 animate-ping" />
            <span className="font-mono text-xs uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-semibold">
              Tablero de Operaciones
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Tablero
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Visualiza, organiza y desplaza los tickets en tiempo real según su estado operativo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refresh()}
            className="flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition shadow-sm"
            title="Refrescar datos"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          {/* Prominent Create Ticket Button */}
          <Link
            href="/tickets/new"
            className="quantum-gradient-btn flex h-9.5 items-center gap-2 rounded-xl px-4 text-xs font-bold text-white shadow-lg transition select-none cursor-pointer"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Crear Ticket</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-xl">
        <div className="flex flex-1 items-center gap-2 min-w-[240px] max-w-md rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-xs focus-within:border-cyan-500/50 transition">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por ID (#NX), título, asignado..."
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Section Selector */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Tag className="size-3.5" />
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground font-medium outline-none focus:border-cyan-500 transition"
            >
              <option value="all">Todas las Secciones</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.name}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Selector */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <SlidersHorizontal className="size-3.5" />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground font-medium outline-none focus:border-cyan-500 transition"
            >
              <option value="all">Todas las Prioridades</option>
              <option value="Critical">Crítica</option>
              <option value="High">Alta</option>
              <option value="Medium">Media</option>
              <option value="Low">Baja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Grid Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const columnTickets = filteredIncidents.filter((t) => t.status === col.id)

          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-2xl border ${col.borderColor} bg-card/40 dark:bg-[#0c121e]/60 backdrop-blur-xl shadow-sm min-h-[580px] p-3 transition`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full ${col.dotColor}`} />
                  <h2 className="text-sm font-bold text-foreground">{col.title}</h2>
                </div>
                <span className={`font-mono text-xs px-2.5 py-0.5 rounded-full font-bold ${col.badgeBg}`}>
                  {columnTickets.length}
                </span>
              </div>

              {/* Column Cards List */}
              <div className="flex-1 mt-3 space-y-3 overflow-y-auto max-h-[calc(100vh-260px)] pr-0.5">
                {columnTickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-dashed border-border/50 bg-background/20 text-muted-foreground">
                    <span className="text-2xl mb-1 opacity-40">📂</span>
                    <span className="text-xs font-medium">No hay tickets en este estado</span>
                  </div>
                ) : (
                  columnTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="group relative flex flex-col rounded-xl border border-border/70 bg-card hover:border-cyan-500/40 p-3.5 shadow-sm hover:shadow-md transition duration-200"
                    >
                      {/* Top row: ID + Priority */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Link
                          href={`/incidents/${ticket.id.replace('#', '')}`}
                          className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                          title="Ingresar al Ticket"
                        >
                          <span>{ticket.id}</span>
                          <ArrowRight className="size-3" />
                        </Link>
                        {getPriorityBadge(ticket.priority)}
                      </div>

                      {/* Ticket Title */}
                      <Link
                        href={`/incidents/${ticket.id.replace('#', '')}`}
                        className="text-xs sm:text-sm font-bold text-foreground hover:text-cyan-500 transition line-clamp-2 leading-snug cursor-pointer"
                        title={`Ingresar al ticket: ${ticket.title}`}
                      >
                        {ticket.title}
                      </Link>

                      {/* Middle metadata: Section Tag + Creator + Time */}
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-semibold border border-border">
                          {ticket.service || ticket.tag || 'General'}
                        </span>
                        {ticket.reporter?.name && (
                          <span
                            className="font-mono text-[10px] text-muted-foreground flex items-center gap-1 bg-background/60 px-1.5 py-0.5 rounded border border-border/60"
                            title={`Creado por: ${ticket.reporter.name}${ticket.reporter.email ? ` (${ticket.reporter.email})` : ''}`}
                          >
                            <User className="size-2.5 text-cyan-500 shrink-0" />
                            <span className="truncate max-w-[95px]">{ticket.reporter.name}</span>
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {ticket.createdTime}
                        </span>
                        {ticket.attachments && ticket.attachments.length > 0 && (
                          <span
                            className="flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30"
                            title={`${ticket.attachments.length} archivo(s) adjunto(s)`}
                          >
                            <Paperclip className="size-3" />
                            <span>{ticket.attachments.length}</span>
                          </span>
                        )}
                      </div>

                      {/* Bottom row: Assignee + Status Switcher */}
                      <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between gap-2">
                        {/* Assignee Avatar */}
                        <div className="flex items-center gap-1.5 min-w-0" title={`Asignado a: ${ticket.assignee.name}`}>
                          <div className="size-6 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono text-[10px] font-bold text-cyan-600 dark:text-cyan-300 shrink-0">
                            {ticket.assignee.initials || 'UN'}
                          </div>
                          <span className="text-[11px] text-muted-foreground truncate max-w-[85px] font-medium">
                            {ticket.assignee.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Quick Move Selector */}
                          <select
                            disabled={updatingId === ticket.id}
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(ticket.id, e.target.value as IncidentStatus)}
                            className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold text-foreground outline-none cursor-pointer hover:border-cyan-500 transition disabled:opacity-50"
                            title="Mover a otra columna"
                          >
                            <option value="Open">Pendiente</option>
                            <option value="In Progress">En Proceso</option>
                            <option value="Blocked">En Revisión</option>
                            <option value="Resolved">Cerrado</option>
                          </select>

                          {/* Direct Enter Button */}
                          <Link
                            href={`/incidents/${ticket.id.replace('#', '')}`}
                            className="p-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 transition flex items-center justify-center"
                            title="Ingresar al Ticket"
                          >
                            <ArrowRight className="size-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Ticket Details Modal */}
      <AnimatePresence>
        {selectedTicketDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicketDetail(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-card p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-cyan-500">{selectedTicketDetail.id}</span>
                  {getPriorityBadge(selectedTicketDetail.priority)}
                </div>
                <button
                  onClick={() => setSelectedTicketDetail(null)}
                  className="rounded-lg p-1 text-muted-foreground hover:text-foreground transition"
                >
                  ✕
                </button>
              </div>

              {isEditingInModal ? (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Título del Ticket *
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        Prioridad
                      </label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as Priority)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="Critical">Crítica (P1)</option>
                        <option value="High">Alta (P2)</option>
                        <option value="Medium">Media (P3)</option>
                        <option value="Low">Baja (P4)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        Columna / Estado
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as IncidentStatus)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="Open">Pendiente</option>
                        <option value="In Progress">En Progreso</option>
                        <option value="Blocked">En Revisión</option>
                        <option value="Resolved">Cerrado / Resuelto</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        Sección / Servicio
                      </label>
                      <select
                        value={editService}
                        onChange={(e) => setEditService(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        {sections.map((sec) => (
                          <option key={sec.id} value={sec.name}>
                            {sec.name}
                          </option>
                        ))}
                        {!sections.some((s) => s.name === editService) && editService && (
                          <option value={editService}>{editService}</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        Asignado a
                      </label>
                      <select
                        value={editAssignee}
                        onChange={(e) => setEditAssignee(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="">Sin Asignar</option>
                        {assignableUsers.map((u) => (
                          <option key={u.id} value={u.name}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                        {!assignableUsers.some((u) => u.name === editAssignee) && editAssignee && editAssignee !== 'Sin Asignar' && !editAssignee.toLowerCase().includes('super') && (
                          <option value={editAssignee}>{editAssignee}</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setIsEditingInModal(false)}
                      className="px-3.5 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveModalEdit}
                      disabled={isSavingEdit}
                      className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-1.5 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
                    >
                      {isSavingEdit ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Check className="size-3.5" />
                          <span>Guardar Cambios</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{selectedTicketDetail.title}</h2>
                    <div className="mt-2 text-xs text-muted-foreground space-y-1.5">
                      <p><strong>Sección / Servicio:</strong> {selectedTicketDetail.service}</p>
                      <p><strong>Entorno:</strong> {selectedTicketDetail.env}</p>
                      <p><strong>Asignado a:</strong> {selectedTicketDetail.assignee.name}</p>
                      <p className="flex items-center gap-1.5 flex-wrap">
                        <strong>Creado por:</strong>
                        <span className="font-bold text-foreground">{selectedTicketDetail.reporter?.name || 'Operador en Línea'}</span>
                        {selectedTicketDetail.reporter?.email && (
                          <span className="text-[11px] text-muted-foreground font-mono">({selectedTicketDetail.reporter.email})</span>
                        )}
                        {selectedTicketDetail.reporter?.organization && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-secondary text-secondary-foreground border border-border">
                            {selectedTicketDetail.reporter.organization}
                          </span>
                        )}
                      </p>
                      <p><strong>Fecha de Creación:</strong> {selectedTicketDetail.createdTime}</p>
                    </div>
                  </div>

                  {selectedTicketDetail.aiCopilot?.summary && (
                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-foreground space-y-1">
                      <span className="font-bold flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                        <Sparkles className="size-3.5" />
                        Diagnóstico Automático
                      </span>
                      <p className="text-muted-foreground">{selectedTicketDetail.aiCopilot.summary}</p>
                    </div>
                  )}

                  {/* Attachments Section in Modal */}
                  {selectedTicketDetail.attachments && selectedTicketDetail.attachments.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-border">
                      <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        <Paperclip className="size-3.5 text-cyan-500" />
                        Archivos Adjuntos ({selectedTicketDetail.attachments.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedTicketDetail.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={`/api/attachments/${att.id}/download`}
                            download={att.filename}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border bg-secondary/30 hover:border-cyan-500 hover:bg-cyan-500/10 transition text-xs font-mono group"
                          >
                            <span className="truncate group-hover:text-cyan-500">{att.filename}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0">Descargar</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEdit(selectedTicketDetail)}
                        className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer"
                      >
                        <Pencil className="size-3.5" />
                        <span>Editar Ticket</span>
                      </button>

                      <Link
                        href={`/incidents/${selectedTicketDetail.id.replace('#', '')}`}
                        className="quantum-gradient-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow transition"
                      >
                        <span>Ver Ticket Completo</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedTicketDetail(null)
                        setIsEditingInModal(false)
                      }}
                      className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-muted transition cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
