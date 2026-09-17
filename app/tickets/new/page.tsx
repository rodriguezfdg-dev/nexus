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
  ImageIcon,
  X,
} from 'lucide-react'
import { useNexusData, Priority } from '@/lib/data-context'
import { useToast } from '@/components/nexus/toast-provider'
import { FileAttachmentZone, StagedFile } from '@/components/nexus/file-attachment-zone'

export default function NewTicketPage() {
  const router = useRouter()
  const { sections, usersList, assignableUsers, createIncident } = useNexusData()
  const { success, error } = useToast()

  const [title, setTitle] = useState('')
  const [sectionName, setSectionName] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [priority, setPriority] = useState<Priority>('Medium')
  const [environment, setEnvironment] = useState<'Production' | 'Staging' | 'Edge'>('Production')
  const [description, setDescription] = useState('')
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string } | null>(null)

  React.useEffect(() => {
    try {
      const userStr = localStorage.getItem('nexus_user')
      if (userStr) {
        setCurrentUser(JSON.parse(userStr))
      }
    } catch (e) {}
  }, [])

  // Pre-select first section if available
  React.useEffect(() => {
    if (sections.length > 0 && !sectionName) {
      setSectionName(sections[0].name)
    }
  }, [sections, sectionName])

  // Handle image pasting directly from clipboard (Ctrl+V)
  const handleDescriptionPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    try {
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

            let previewUrl: string | undefined
            try {
              previewUrl = URL.createObjectURL(renamedFile)
            } catch {}

            const newStaged: StagedFile = {
              id: `pasted-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              file: renamedFile,
              name: filename,
              size: renamedFile.size || 0,
              type: renamedFile.type || 'image/png',
              previewUrl,
            }

            setStagedFiles((prev) => [...prev, newStaged])

            // Insert text marker in textarea
            const target = e.currentTarget
            const start = target.selectionStart ?? (description || '').length
            const end = target.selectionEnd ?? (description || '').length
            const marker = `\n[📷 Imagen pegada: ${filename}]\n`
            const updated = (description || '').substring(0, start) + marker + (description || '').substring(end)
            setDescription(updated)

            success('Imagen Pegada', `Se adjuntó la captura "${filename}" desde el portapapeles.`)
          }
        }
      }
    } catch (err: any) {
      console.error('Error pasting image:', err)
      error('Error al pegar imagen', 'No se pudo procesar la imagen del portapapeles.')
    }
  }

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

      const reporterName = currentUser?.name || 'Operador en Línea'
      const reporterEmail = currentUser?.email || 'soporte@nexus.io'
      const reporterOrg = currentUser?.role || 'Sede Central'

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
          name: reporterName,
          email: reporterEmail,
          organization: reporterOrg,
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
        formData.append('uploadedBy', reporterName)
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

        {/* Current Creator / Requester Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-600 dark:text-cyan-400 text-xs shadow-xs">
              {(currentUser?.name || 'OP').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground font-medium">Registrando ticket como solicitante:</span>
              <span className="font-bold text-foreground">{currentUser?.name || 'Operador en Línea'}</span>
              {currentUser?.role && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-semibold uppercase border border-border">
                  {currentUser.role}
                </span>
              )}
            </div>
          </div>
          {currentUser?.email && (
            <span className="text-[11px] text-muted-foreground font-mono">{currentUser.email}</span>
          )}
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
                sections.map((sec) => {
                  const isAuditoria =
                    sec.name.toLowerCase().includes('aditor') ||
                    sec.name.toLowerCase() === 'auditoria' ||
                    sec.name.toLowerCase() === 'auditoría'
                  const displayName = isAuditoria ? 'Auditoría' : sec.name
                  const hasDistinctDesc =
                    sec.description &&
                    sec.description.trim().length > 0 &&
                    sec.description.trim().toLowerCase() !== sec.name.trim().toLowerCase() &&
                    !sec.description.toLowerCase().includes('aditor') &&
                    !sec.description.toLowerCase().includes('auditor')
                  return (
                    <option key={sec.id} value={displayName}>
                      {displayName} {hasDistinctDesc ? `(${sec.description})` : ''}
                    </option>
                  )
                })
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
              Usuario Asignado (Solo TI)
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500 transition font-medium"
            >
              <option value="">-- Sin Asignar (Cola Libre) --</option>
              {assignableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role}) - {user.email}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-muted-foreground">
              Solo se pueden asignar técnicos y miembros del equipo de TI.
            </span>
          </div>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Flame className="size-3.5 text-rose-500" />
            Nivel de Prioridad *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(['Low', 'Medium', 'High', 'Critical'] as Priority[]).map((lvl) => {
              const isSelected = priority === lvl
              const labels: Record<Priority, string> = {
                Low: 'Baja',
                Medium: 'Media',
                High: 'Alta',
                Critical: 'Crítica',
              }
              const colors: Record<Priority, string> = {
                Low: isSelected ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-border text-muted-foreground hover:text-foreground',
                Medium: isSelected ? 'bg-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400' : 'border-border text-muted-foreground hover:text-foreground',
                High: isSelected ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400' : 'border-border text-muted-foreground hover:text-foreground',
                Critical: isSelected ? 'bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-400' : 'border-border text-muted-foreground hover:text-foreground',
              }

              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setPriority(lvl)}
                  className={`rounded-xl border py-2.5 text-xs font-bold text-center transition cursor-pointer ${colors[lvl]}`}
                >
                  {labels[lvl]}
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
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onPaste={handleDescriptionPaste}
            placeholder="Detalla qué está ocurriendo, pasos para reproducirlo, clientes afectados... (Puedes presionar Ctrl+V aquí para pegar una imagen o captura de pantalla)"
            className="w-full rounded-xl border border-border bg-background/80 p-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition resize-y font-normal"
          />

          {/* Pasted Images Strip */}
          {stagedFiles.filter((f) => f.file.type.startsWith('image/')).length > 0 && (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="size-3.5" />
                  Capturas / Imágenes pegadas ({stagedFiles.filter((f) => f.file.type.startsWith('image/')).length})
                </span>
                <span className="text-[10px] opacity-75">Se guardarán automáticamente con el ticket</span>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {stagedFiles
                  .filter((f) => f.file.type.startsWith('image/'))
                  .map((img) => (
                    <div
                      key={img.id}
                      className="group relative flex items-center gap-2 rounded-lg border border-border bg-card p-1.5 pr-2.5 shadow-sm hover:border-cyan-500/50 transition"
                    >
                      {img.previewUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img.previewUrl}
                          alt={img.file.name}
                          className="size-10 rounded-md object-cover border border-border/60"
                        />
                      )}
                      <div className="text-[11px] max-w-[150px] truncate">
                        <p className="font-medium text-foreground truncate">{img.file.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {(img.file.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setStagedFiles((prev) => prev.filter((item) => item.id !== img.id))
                        }
                        className="ml-1 p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Quitar imagen"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
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
