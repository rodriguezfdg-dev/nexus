'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getIncidentById,
  IncidentDetail,
  IncidentStatus,
  macroTemplates,
  TimelineEvent,
  Priority,
  TicketAttachment,
} from '@/lib/mock-incidents'
import { FileAttachmentZone } from '@/components/nexus/file-attachment-zone'
import { useNexusData } from '@/lib/data-context'
import {
  ArrowLeft,
  Clock,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Terminal,
  FileUp,
  Code,
  Send,
  Lock,
  MessageSquare,
  Activity,
  RotateCcw,
  Check,
  X,
  Radio,
  ChevronDown,
  Layers,
  Zap,
  Info,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  Tag,
  User,
  Sliders,
  ImageIcon,
} from 'lucide-react'

export default function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const unwrappedParams = use(params)
  const router = useRouter()
  const rawId = unwrappedParams.id || 'NX-8942'

  const [incident, setIncident] = useState<IncidentDetail>(() => getIncidentById(rawId))
  const [currentStatus, setCurrentStatus] = useState<IncidentStatus>(incident.status)
  const [slaRemaining, setSlaRemaining] = useState<number>(incident.slaSecondsRemaining)

  // AI Streaming state
  const [streamingText, setStreamingText] = useState('')
  const [isStreamingDone, setIsStreamingDone] = useState(false)

  // AI Auto-resolve execution console state
  const [isResolving, setIsResolving] = useState(false)
  const [resolveStep, setResolveStep] = useState<number>(-1)
  const [resolveStatus, setResolveStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle')

  const [feedbackToast, setFeedbackToast] = useState<string | null>(null)

  const { sections, usersList, assignableUsers, deleteIncident, refresh: refreshData } = useNexusData()

  // Edit ticket state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editPriority, setEditPriority] = useState<Priority>('Medium')
  const [editStatus, setEditStatus] = useState<IncidentStatus>('Open')
  const [editService, setEditService] = useState('')
  const [editEnv, setEditEnv] = useState<'Production' | 'Staging' | 'Edge'>('Production')
  const [editAssigneeName, setEditAssigneeName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Delete ticket state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Synchronize when rawId changes from SQLite or fallback
  useEffect(() => {
    let isMounted = true
    async function fetchFromDb() {
      try {
        const res = await fetch(`/api/incidents/${encodeURIComponent(rawId)}`)
        if (res.ok) {
          const data = await res.json()
          let atts = data.attachments || []
          try {
            const attRes = await fetch(`/api/attachments?incidentId=${encodeURIComponent(rawId)}`)
            if (attRes.ok) {
              const freshAtts = await attRes.json()
              if (Array.isArray(freshAtts) && freshAtts.length > 0) {
                atts = freshAtts
              }
            }
          } catch {}

          if (isMounted) {
            setIncident({ ...data, attachments: atts })
            setCurrentStatus(data.status)
            setSlaRemaining(data.slaSecondsRemaining)
            setEditTitle(data.title || '')
            setEditPriority(data.priority || 'Medium')
            setEditStatus(data.status || 'Open')
            setEditService(data.service || '')
            setEditEnv(data.env || 'Production')
            setEditAssigneeName(data.assignee?.name || '')
            setEditDescription(data.description || '')
            return
          }
        }
      } catch (e) {
        // Fallback below
      }
      const data = getIncidentById(rawId)
      if (isMounted) {
        setIncident(data)
        setCurrentStatus(data.status)
        setSlaRemaining(data.slaSecondsRemaining)
        setEditTitle(data.title || '')
        setEditPriority(data.priority || 'Medium')
        setEditStatus(data.status || 'Open')
        setEditService(data.service || '')
        setEditEnv(data.env || 'Production')
        setEditAssigneeName(data.assignee?.name || '')
        setEditDescription((data as any).description || '')
      }
    }
    fetchFromDb()
    return () => {
      isMounted = false
    }
  }, [rawId])

  const handleAttachmentUploaded = (att: any) => {
    if (!att) return
    const list: TicketAttachment[] = Array.isArray(att.attachments) ? att.attachments : [att]
    const validList = list.filter((a) => a && (a.filename || a.id))
    if (validList.length === 0) return

    setIncident((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...validList],
    }))
    const names = validList.map((a) => a.filename).filter(Boolean).join(', ')
    showToast(names ? `Archivo adjunto subido: ${names}` : 'Archivo adjuntado con éxito')
  }

  const handleAttachmentDeleted = (id: string) => {
    setIncident((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((a) => a.id !== id),
    }))
    showToast('Archivo adjunto eliminado')
  }

  // --- EDIT TICKET HANDLERS ---
  const openEditModal = () => {
    setEditTitle(incident.title)
    setEditPriority(incident.priority)
    setEditStatus(currentStatus)
    setEditService(incident.service)
    setEditEnv(incident.env)
    setEditAssigneeName(incident.assignee.name)
    setShowEditModal(true)
  }

  // Handle image pasting directly from clipboard (Ctrl+V)
  const handleDescriptionPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type && item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          e.preventDefault()
          const now = new Date()
          const pad = (n: number) => String(n).padStart(2, '0')
          const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
          const ext = (file.type ? file.type.split('/')[1] : 'png') || 'png'
          const filename = `captura_${timestamp}.${ext}`
          const renamedFile = new File([file], filename, { type: file.type || 'image/png' })

          let uName = 'Operador en Línea'
          try {
            const uStr = localStorage.getItem('nexus_user')
            if (uStr) {
              const u = JSON.parse(uStr)
              if (u.name) uName = u.name
            }
          } catch {}

          showToast('Subiendo captura pegada...')
          try {
            const formData = new FormData()
            formData.append('files', renamedFile)
            formData.append('file', renamedFile)
            formData.append('incidentId', incident.id)
            formData.append('uploadedBy', uName)

            const res = await fetch('/api/attachments', {
              method: 'POST',
              body: formData,
            })
            if (res.ok) {
              const uploadedData = await res.json()
              const attList = uploadedData.attachments || [uploadedData]
              attList.forEach((attItem: TicketAttachment) => handleAttachmentUploaded(attItem))

              // Insert text marker in textarea
              const target = e.currentTarget
              const start = target.selectionStart ?? (editDescription || '').length
              const end = target.selectionEnd ?? (editDescription || '').length
              const marker = `\n[📷 Captura pegada: ${filename}]\n`
              const updated = (editDescription || '').substring(0, start) + marker + (editDescription || '').substring(end)
              setEditDescription(updated)

              showToast(`¡Captura ${filename} subida y adjuntada!`)
            } else {
              showToast('Error al subir la captura al servidor.')
            }
          } catch (err: any) {
            console.error('Error pasting image:', err)
            showToast(`Error al subir imagen: ${err.message}`)
          }
        }
      }
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim()) {
      showToast('El título del ticket no puede estar vacío')
      return
    }

    setIsSavingEdit(true)
    try {
      const selectedUser = usersList.find((u) => u.name === editAssigneeName)
      const initials = editAssigneeName
        ? editAssigneeName
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        : 'UN'

      const payload = {
        id: incident.id,
        title: editTitle.trim(),
        priority: editPriority,
        status: currentStatus,
        service: editService.trim() || 'Soporte General',
        env: editEnv,
        tag: editService.trim() || 'Soporte General',
        assignee: {
          name: editAssigneeName.trim() || 'Sin Asignar',
          initials,
          status: 'online' as const,
        },
        description: editDescription.trim(),
      }

      const res = await fetch(`/api/incidents/${encodeURIComponent(rawId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error('Fallo al actualizar el ticket en el servidor')
      }

      // Update state locally
      setIncident((prev) => ({
        ...prev,
        ...payload,
      }))

      showToast('¡Ticket actualizado exitosamente!')
      refreshData()
    } catch (err: any) {
      console.error(err)
      showToast(`Error al guardar: ${err.message}`)
    } finally {
      setIsSavingEdit(false)
    }
  }

  // --- DELETE TICKET HANDLERS ---
  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/incidents/${encodeURIComponent(rawId)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error('No se pudo eliminar el ticket del servidor')
      }

      await deleteIncident(incident.id)
      showToast(`Ticket ${incident.id} eliminado definitivamente`)
      router.push('/kanban')
    } catch (err: any) {
      console.error(err)
      showToast(`Error al eliminar ticket: ${err.message}`)
      setIsDeleting(false)
    }
  }

  // SLA Live Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSlaRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Typewriter streaming effect for AI summary on mount
  useEffect(() => {
    setStreamingText('')
    setIsStreamingDone(false)
    const fullText = incident.aiCopilot.summary
    let index = 0

    const streamInterval = setInterval(() => {
      if (index < fullText.length) {
        setStreamingText(fullText.slice(0, index + 2))
        index += 2
      } else {
        setStreamingText(fullText)
        setIsStreamingDone(true)
        clearInterval(streamInterval)
      }
    }, 12)

    return () => clearInterval(streamInterval)
  }, [incident.aiCopilot.summary])

  // Toast feedback helper
  const showToast = (msg: string) => {
    setFeedbackToast(msg)
    setTimeout(() => setFeedbackToast(null), 3500)
  }

  // Format SLA mm:ss
  const formatSla = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`
  }

  // SLA calculation
  const slaPercentRemaining = Math.max(0, Math.min(100, (slaRemaining / incident.slaSecondsTotal) * 100))
  const slaConsumedPercent = 100 - slaPercentRemaining

  // Execute 1-Click AI Auto-Resolve Sequence
  const runAiAutoResolve = async (simulateFailure = false) => {
    setIsResolving(true)
    setResolveStatus('running')
    setResolveStep(0)

    const steps = incident.aiCopilot.resolutionSteps

    for (let i = 0; i < steps.length; i++) {
      setResolveStep(i)
      // simulate realistic terminal execution delay per step
      await new Promise((r) => setTimeout(r, 900))

      if (simulateFailure && i === 2) {
        setResolveStatus('failed')
        setIsResolving(false)
        showToast('AI Auto-Resolve interrupted: Pod buffer lock conflict')
        return
      }
    }

    setResolveStatus('success')
    setIsResolving(false)
    setCurrentStatus('Resolved')

    // Inject resolution log into timeline
    const resolutionEvent: TimelineEvent = {
      id: `evt-res-${Date.now()}`,
      type: 'system_event',
      author: { name: 'Nexus Quantum Copilot', role: 'Autonomous SRE', initials: 'AI' },
      timestamp: 'Just now',
      content: `AUTONOMOUS REMEDIATION COMPLETE: All ${steps.length} diagnostic and repair steps executed successfully. Service metrics normalized below SLO threshold.`,
      metadata: { logLevel: 'INFO', latency: '14ms', source: 'Nexus-AutoHeal-Worker' }
    }
    setIncident((prev) => ({
      ...prev,
      timeline: [resolutionEvent, ...prev.timeline],
    }))

    showToast('Incident successfully resolved via Quantum AI Auto-Resolve')
  }

  return (
    <div className="w-full flex flex-col gap-6 pb-16">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {feedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className="fixed top-20 right-8 z-50 flex items-center gap-2.5 rounded-xl border border-cyan-500/40 bg-card/90 px-4 py-3 text-xs text-foreground shadow-2xl backdrop-blur-xl"
          >
            <Check className="size-4 text-cyan-500 shrink-0" />
            <span className="font-mono">{feedbackToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <Link
            href="/kanban"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-1.5 transition"
          >
            <ArrowLeft className="size-3.5" />
            <span>Volver al Tablero</span>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-lg font-extrabold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-lg">
              {incident.id}
            </span>
            <span className="text-xs text-muted-foreground">
              Abierto {incident.createdTime}
            </span>
            {incident.reporter?.name && (
              <span className="text-xs font-medium text-foreground flex items-center gap-1.5 bg-card/80 px-2.5 py-1 rounded-lg border border-border shadow-xs">
                <User className="size-3.5 text-cyan-500" />
                <span className="text-muted-foreground">Creado por:</span>
                <strong className="text-cyan-700 dark:text-cyan-300 font-bold">{incident.reporter.name}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Status Switcher Pills + Delete button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card/70 p-1 backdrop-blur-md shadow-sm">
            {(['Open', 'In Progress', 'Blocked', 'Resolved'] as IncidentStatus[]).map((status) => {
              const isActive = currentStatus === status
              const statusLabels: Record<IncidentStatus, string> = {
                Open: 'Pendiente',
                'In Progress': 'En Progreso',
                Blocked: 'En Revisión',
                Resolved: 'Cerrado',
              }
              const statusStyles = {
                Open: 'text-amber-600 dark:text-amber-400 border-amber-500/30',
                'In Progress': 'text-cyan-600 dark:text-cyan-300 border-cyan-500/30',
                Blocked: 'text-rose-600 dark:text-rose-400 border-rose-500/30',
                Resolved: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
              }

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setCurrentStatus(status)
                    showToast(`Estado cambiado a ${statusLabels[status]}`)
                  }}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                    isActive ? `${statusStyles[status]} font-bold` : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="statusPillBg"
                      className="absolute inset-0 rounded-lg bg-secondary border border-border shadow-sm"
                      transition={{ type: 'spring', bounce: 0.18, duration: 0.35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <span
                      className={`size-1.5 rounded-full ${
                        status === 'Open'
                          ? 'bg-amber-500'
                          : status === 'In Progress'
                          ? 'bg-cyan-500 animate-pulse'
                          : status === 'Blocked'
                          ? 'bg-rose-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    {statusLabels[status]}
                  </span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 transition shadow-sm cursor-pointer"
            title="Borrar este ticket definitivamente"
          >
            <Trash2 className="size-3.5" />
            <span>Borrar</span>
          </button>
        </div>
      </div>

      {/* Main Ticket Form Sheet (Exact layout as /tickets/new) */}
      <form
        onSubmit={handleSaveEdit}
        className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-xl p-6 sm:p-8 shadow-xl space-y-6"
      >
        {/* Title */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileText className="size-3.5 text-cyan-500" />
            Título del Ticket / Incidente *
          </label>
          <input
            type="text"
            required
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Ej: Interrupción intermitente en servidor..."
            className="w-full rounded-xl border border-border bg-background/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition font-medium"
          />
        </div>

        {/* Creator / Requester Identity Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 dark:bg-cyan-950/20 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-600 dark:text-cyan-400 text-sm shadow-xs shrink-0">
              {(incident.reporter?.name || 'OP').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Usuario Creador / Solicitante:</span>
                <span className="font-bold text-foreground text-sm">{incident.reporter?.name || 'Operador en Línea'}</span>
                {incident.reporter?.organization && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-semibold border border-border">
                    {incident.reporter.organization}
                  </span>
                )}
              </div>
              {incident.reporter?.email && (
                <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {incident.reporter.email}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Fecha de creación:</span>
            <span className="font-mono font-bold text-foreground bg-background/80 px-2.5 py-1 rounded-lg border border-border">
              {incident.createdTime || 'Justo ahora'}
            </span>
          </div>
        </div>

        {/* 2-Column Grid: Section & Assignee */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Section / Department */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Tag className="size-3.5 text-violet-500" />
              Tipo de Sección / Departamento *
            </label>
            <select
              value={editService}
              onChange={(e) => setEditService(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500 transition font-medium"
            >
              {sections.length === 0 ? (
                <option value={editService || 'Soporte General'}>{editService || 'Soporte General'}</option>
              ) : (
                sections.map((sec) => (
                  <option key={sec.id} value={sec.name}>
                    {sec.name} {sec.description ? `(${sec.description})` : ''}
                  </option>
                ))
              )}
              {!sections.some((s) => s.name === editService) && editService && (
                <option value={editService}>{editService}</option>
              )}
            </select>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="size-3.5 text-cyan-500" />
              Usuario Asignado
            </label>
            <select
              value={editAssigneeName}
              onChange={(e) => setEditAssigneeName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500 transition font-medium"
            >
              <option value="">-- Sin Asignar (Cola Libre) --</option>
              {assignableUsers.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name} ({u.role})
                </option>
              ))}
              {!assignableUsers.some((u) => u.name === editAssigneeName) && editAssigneeName && editAssigneeName !== 'Sin Asignar' && !editAssigneeName.toLowerCase().includes('super') && (
                <option value={editAssigneeName}>{editAssigneeName}</option>
              )}
            </select>
          </div>
        </div>

        {/* Priority Pills */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Flame className="size-3.5 text-rose-500" />
            Nivel de Prioridad *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'Low', label: 'Baja' },
              { id: 'Medium', label: 'Media' },
              { id: 'High', label: 'Alta' },
              { id: 'Critical', label: 'Crítica' },
            ].map((p) => {
              const isActive = editPriority === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setEditPriority(p.id as Priority)}
                  className={`rounded-xl border py-2.5 text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                    isActive
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 shadow-sm'
                      : 'border-border bg-background/60 text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Detailed Description */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="size-3.5 text-cyan-500" />
              Descripción Detallada del Problema
            </label>
            <span className="text-[11px] text-cyan-600 dark:text-cyan-400 flex items-center gap-1 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
              <ImageIcon className="size-3" />
              Presiona Ctrl+V para pegar capturas de pantalla
            </span>
          </div>
          <textarea
            rows={5}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            onPaste={handleDescriptionPaste}
            placeholder="Detalla qué está ocurriendo, pasos para reproducirlo, clientes afectados... (Puedes presionar Ctrl+V aquí para pegar una imagen o captura)"
            className="w-full rounded-xl border border-border bg-background/80 p-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition resize-y font-normal"
          />
        </div>

        {/* Universal File Attachments Zone */}
        <div className="pt-2">
          <FileAttachmentZone
            incidentId={incident.id}
            existingAttachments={incident.attachments || []}
            onAttachmentUploaded={handleAttachmentUploaded}
            onAttachmentDeleted={handleAttachmentDeleted}
            title="Adjuntar Archivos al Ticket"
            description="Puedes adjuntar archivos de todo tipo: capturas de pantalla, archivos de log, volcados de memoria (.dmp), documentos PDF/Word, archivos ZIP o scripts de código."
          />
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/70">
          <Link
            href="/kanban"
            className="rounded-xl border border-border px-5 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
          >
            Cancelar / Volver
          </Link>

          <button
            type="submit"
            disabled={isSavingEdit}
            className="quantum-gradient-btn flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            {isSavingEdit ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Guardando Cambios...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                <span>Guardar Cambios del Ticket</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Edit Ticket Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="nexus-glass-card rounded-2xl border border-border/80 bg-card p-6 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-5"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                    <Pencil className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Editar Ticket</h3>
                    <p className="text-xs text-muted-foreground">Modifica los detalles del ticket <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">{incident.id}</span></p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Título del Ticket *
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    placeholder="Ej. Interrupción de servicio en módulo de pagos..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Prioridad
                    </label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as Priority)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                    >
                      <option value="Critical">Critical (P1)</option>
                      <option value="High">High (P2)</option>
                      <option value="Medium">Medium (P3)</option>
                      <option value="Low">Low (P4)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Estado
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as IncidentStatus)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Blocked">Blocked</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Servicio / Sección
                  </label>
                  <select
                    value={editService}
                    onChange={(e) => setEditService(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
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
                    Responsable Asignado
                  </label>
                  <select
                    value={editAssigneeName}
                    onChange={(e) => setEditAssigneeName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                  >
                    <option value="">Sin Asignar</option>
                    {assignableUsers.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                    {!assignableUsers.some((u) => u.name === editAssigneeName) && editAssigneeName && editAssigneeName !== 'Sin Asignar' && !editAssigneeName.toLowerCase().includes('super') && (
                      <option value={editAssigneeName}>{editAssigneeName}</option>
                    )}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 transition disabled:opacity-50"
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
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Ticket Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="nexus-glass-card rounded-2xl border border-rose-500/40 bg-card p-6 shadow-2xl w-full max-w-md space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Eliminar Ticket Definitivamente</h3>
                  <p className="text-xs text-muted-foreground">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-foreground/90 space-y-1.5 leading-relaxed">
                <p>
                  ¿Confirmas que deseas eliminar el ticket <strong className="font-mono text-rose-600 dark:text-rose-400">{incident.id}</strong>?
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Título: <span className="font-medium text-foreground italic">&ldquo;{incident.title}&rdquo;</span>
                </p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  • Se borrarán permanentemente todos los registros y archivos adjuntos asociados.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-3.5" />
                      <span>Sí, eliminar ticket</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
