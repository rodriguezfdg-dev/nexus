'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  PlusCircle,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Tag,
  User,
  Flame,
  FileText,
  Sliders,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { useNexusData, Priority } from '@/lib/data-context'
import { useToast } from '@/components/nexus/toast-provider'
import { FileAttachmentZone, StagedFile } from '@/components/nexus/file-attachment-zone'

export default function NewTicketPage() {
  const router = useRouter()
  const { sections, usersList, createIncident } = useNexusData()
  const { success, error } = useToast()

  const [title, setTitle] = useState('')
  const [sectionName, setSectionName] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [priority, setPriority] = useState<Priority>('Medium')
  const [environment, setEnvironment] = useState<'Production' | 'Staging' | 'Edge'>('Production')
  const [description, setDescription] = useState('')
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([])
  const [loading, setLoading] = useState(false)

  // Pre-select first section if available
  React.useEffect(() => {
    if (sections.length > 0 && !sectionName) {
      setSectionName(sections[0].name)
    }
  }, [sections, sectionName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      error('Campo Requerido', 'Debes escribir un título para el ticket.')
      return
    }

    setLoading(true)
    try {
      // Find assignee details
      const selectedUser = usersList.find((u) => u.id === assigneeId)
      const assigneeName = selectedUser ? selectedUser.name : 'Sin Asignar'
      const assigneeInitials = selectedUser
        ? selectedUser.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
        : 'UN'

      const ticketId = await createIncident({
        title: title.trim(),
        priority,
        service: sectionName || 'Soporte General',
        env: environment,
        assignee: {
          name: assigneeName,
          initials: assigneeInitials,
          status: 'online',
        },
        reporter: {
          name: 'Operador en Línea',
          email: 'soporte@nexus.io',
          organization: 'Sede Central',
        },
        slaSecondsTotal: priority === 'Critical' ? 1800 : priority === 'High' ? 3600 : 14400,
        slaSecondsRemaining: priority === 'Critical' ? 1800 : priority === 'High' ? 3600 : 14400,
        aiTriaged: false,
        assignedToMe: Boolean(selectedUser),
        tag: sectionName || 'General',
        createdTime: 'Justo ahora',
      })

      // If user selected files to attach, upload them now
      if (stagedFiles.length > 0) {
        const formData = new FormData()
        formData.append('incidentId', ticketId)
        formData.append('uploadedBy', 'Operador en Línea')
        stagedFiles.forEach((f) => {
          formData.append('files', f.file)
        })

        await fetch('/api/attachments', {
          method: 'POST',
          body: formData,
        })
      }

      success('Ticket Creado con Éxito', `Ticket ${ticketId} registrado con ${stagedFiles.length} adjunto(s).`)
      router.push('/kanban')
    } catch (err: any) {
      console.error(err)
      error('Error al Crear Ticket', err.message || 'Ocurrió un fallo en el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <Link
            href="/kanban"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2 transition"
          >
            <ArrowLeft className="size-3.5" />
            <span>Volver al Tablero</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <PlusCircle className="size-7 text-cyan-500" />
            <span>Crear Nuevo Ticket</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Ingresa los detalles para registrar un nuevo incidente o solicitud de soporte.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Interrupción intermitente en servidor de base de datos..."
            className="w-full rounded-xl border border-border bg-background/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition font-medium"
          />
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
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500 transition font-medium"
            >
              {sections.length === 0 ? (
                <option value="Soporte General">Soporte General</option>
              ) : (
                sections.map((sec) => (
                  <option key={sec.id} value={sec.name}>
                    {sec.name} {sec.description ? `(${sec.description})` : ''}
                  </option>
                ))
              )}
            </select>
            <span className="text-[11px] text-muted-foreground">
              Las secciones se pueden administrar desde el{' '}
              <Link href="/admin" className="text-cyan-600 dark:text-cyan-400 hover:underline">
                Panel de Control
              </Link>
              .
            </span>
          </div>

          {/* User Assignee */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="size-3.5 text-cyan-500" />
              Usuario Asignado
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500 transition font-medium"
            >
              <option value="">-- Sin Asignar (Cola Libre) --</option>
              {usersList.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role}) - {user.email}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-muted-foreground">
              Puedes asignar a cualquier técnico registrado.
            </span>
          </div>
        </div>

        {/* 2-Column Grid: Priority & Environment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Priority */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Flame className="size-3.5 text-rose-500" />
              Nivel de Prioridad *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Low', 'Medium', 'High', 'Critical'] as Priority[]).map((lvl) => {
                const isSelected = priority === lvl
                const labels: Record<Priority, string> = {
                  Low: 'Baja',
                  Medium: 'Media',
                  High: 'Alta',
                  Critical: 'Crítica',
                }
                const colors: Record<Priority, string> = {
                  Low: isSelected ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-border text-muted-foreground',
                  Medium: isSelected ? 'bg-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400' : 'border-border text-muted-foreground',
                  High: isSelected ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400' : 'border-border text-muted-foreground',
                  Critical: isSelected ? 'bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-400' : 'border-border text-muted-foreground',
                }

                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setPriority(lvl)}
                    className={`rounded-xl border py-2 text-xs font-bold text-center transition ${colors[lvl]}`}
                  >
                    {labels[lvl]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Environment */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sliders className="size-3.5 text-amber-500" />
              Entorno / Alcance
            </label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as any)}
              className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500 transition font-medium"
            >
              <option value="Production">Producción (Servicio Activo)</option>
              <option value="Staging">Pruebas / Staging</option>
              <option value="Edge">Sede Remota / Edge</option>
            </select>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileText className="size-3.5 text-cyan-500" />
            Descripción Detallada del Problema
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalla qué está ocurriendo, pasos para reproducirlo, clientes afectados..."
            className="w-full rounded-xl border border-border bg-background/80 p-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition resize-y font-normal"
          />
        </div>

        {/* Universal File Attachments Zone */}
        <div className="pt-2">
          <FileAttachmentZone
            stagedFiles={stagedFiles}
            onStagedFilesChange={setStagedFiles}
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
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="quantum-gradient-btn flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Creando Ticket...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                <span>Registrar Ticket</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
