'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileUp,
  FileText,
  FileCode,
  FileArchive,
  Image as ImageIcon,
  FileSpreadsheet,
  Terminal,
  Film,
  Paperclip,
  Download,
  Eye,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  UploadCloud,
} from 'lucide-react'
import { TicketAttachment } from '@/lib/data-context'

export interface StagedFile {
  file: File
  id: string
  name: string
  size: number
  type: string
  previewUrl?: string
}

interface FileAttachmentZoneProps {
  // Staged mode (for ticket creation form)
  stagedFiles?: StagedFile[]
  onStagedFilesChange?: (files: StagedFile[]) => void

  // Live mode (for existing ticket detail)
  incidentId?: string
  existingAttachments?: TicketAttachment[]
  onAttachmentUploaded?: (attachment: TicketAttachment) => void
  onAttachmentDeleted?: (id: string) => void

  title?: string
  description?: string
  allowUpload?: boolean
  readOnly?: boolean
  compact?: boolean
}

// Helper to determine file category and visual styling
export function getFileInfo(filename?: string, mimeType?: string) {
  const safeName = typeof filename === 'string' ? filename : ''
  const ext = safeName.split('.').pop()?.toLowerCase() || ''

  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext) || mimeType?.startsWith('image/')) {
    return {
      category: 'image',
      icon: ImageIcon,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      badge: 'IMAGEN',
      badgeClass: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    }
  }

  if (['pdf'].includes(ext) || mimeType === 'application/pdf') {
    return {
      category: 'pdf',
      icon: FileText,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      badge: 'PDF',
      badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    }
  }

  if (['xlsx', 'xls', 'csv', 'tsv'].includes(ext)) {
    return {
      category: 'spreadsheet',
      icon: FileSpreadsheet,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      badge: 'HOJA / DATOS',
      badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    }
  }

  if (['doc', 'docx', 'odt', 'rtf', 'txt', 'md'].includes(ext)) {
    return {
      category: 'document',
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      badge: 'DOCUMENTO',
      badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    }
  }

  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) {
    return {
      category: 'archive',
      icon: FileArchive,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      badge: 'COMPRIMIDO',
      badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    }
  }

  if (['log', 'dmp', 'dump', 'crash', 'trace', 'out', 'err', 'diag'].includes(ext)) {
    return {
      category: 'log',
      icon: Terminal,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-600/10',
      borderColor: 'border-rose-600/30',
      badge: 'LOG / VOLCADO',
      badgeClass: 'bg-rose-600/15 text-rose-600 dark:text-rose-400 border-rose-600/30',
    }
  }

  if (['js', 'ts', 'jsx', 'tsx', 'py', 'json', 'yaml', 'yml', 'xml', 'html', 'css', 'sql', 'sh', 'bat', 'ps1', 'env', 'conf', 'ini'].includes(ext)) {
    return {
      category: 'code',
      icon: FileCode,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/30',
      badge: 'CÓDIGO / CONFIG',
      badgeClass: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
    }
  }

  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'mp3', 'wav', 'ogg'].includes(ext)) {
    return {
      category: 'media',
      icon: Film,
      color: 'text-fuchsia-500',
      bgColor: 'bg-fuchsia-500/10',
      borderColor: 'border-fuchsia-500/30',
      badge: 'MULTIMEDIA',
      badgeClass: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30',
    }
  }

  return {
    category: 'generic',
    icon: Paperclip,
    color: 'text-muted-foreground',
    bgColor: 'bg-secondary/40',
    borderColor: 'border-border',
    badge: ext ? ext.toUpperCase() : 'ARCHIVO',
    badgeClass: 'bg-secondary text-secondary-foreground border-border',
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function FileAttachmentZone({
  stagedFiles = [],
  onStagedFilesChange,
  incidentId,
  existingAttachments = [],
  onAttachmentUploaded,
  onAttachmentDeleted,
  title = 'Archivos Adjuntos',
  description = 'Arrastra y suelta cualquier tipo de archivo (imágenes, logs, PDFs, comprimidos, código, etc.) o haz clic para examinar.',
  allowUpload = true,
  readOnly = false,
  compact = false,
}: FileAttachmentZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewItem, setPreviewItem] = useState<{ name: string; url: string; category: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle files selected from input or drag
  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return

    const filesArray = Array.from(fileList)

    // Mode 1: Live upload directly to server for this incident
    if (incidentId && onAttachmentUploaded) {
      setUploading(true)
      try {
        const formData = new FormData()
        formData.append('incidentId', incidentId)
        formData.append('uploadedBy', 'Operador en Turno')

        filesArray.forEach((file) => {
          formData.append('files', file)
        })

        const res = await fetch('/api/attachments', {
          method: 'POST',
          body: formData,
        })

        if (res.ok) {
          const data = await res.json()
          if (data.attachments && Array.isArray(data.attachments)) {
            data.attachments.forEach((att: TicketAttachment) => {
              onAttachmentUploaded(att)
            })
          }
        }
      } catch (err) {
        console.error('Error al subir archivos adjuntos:', err)
      } finally {
        setUploading(false)
      }
      return
    }

    // Mode 2: Staged mode for ticket creation form
    if (onStagedFilesChange) {
      const newStaged: StagedFile[] = filesArray.map((file) => {
        let previewUrl: string | undefined = undefined
        if (file.type.startsWith('image/')) {
          previewUrl = URL.createObjectURL(file)
        }
        return {
          file,
          id: `stage-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          previewUrl,
        }
      })

      onStagedFilesChange([...stagedFiles, ...newStaged])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!readOnly) setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (readOnly) return
    handleFiles(e.dataTransfer.files)
  }

  const handleRemoveStaged = (id: string) => {
    if (!onStagedFilesChange) return
    const target = stagedFiles.find((f) => f.id === id)
    if (target?.previewUrl) {
      URL.revokeObjectURL(target.previewUrl)
    }
    onStagedFilesChange(stagedFiles.filter((f) => f.id !== id))
  }

  const handleDeleteExisting = async (id: string) => {
    if (!onAttachmentDeleted) return
    try {
      const res = await fetch(`/api/attachments?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        onAttachmentDeleted(id)
      }
    } catch (err) {
      console.error('Error al eliminar adjunto:', err)
    }
  }

  const totalAttachments = existingAttachments.length + stagedFiles.length

  return (
    <div className="space-y-4">
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="size-4 text-cyan-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {title}
            </span>
            {totalAttachments > 0 && (
              <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                {totalAttachments} {totalAttachments === 1 ? 'archivo' : 'archivos'}
              </span>
            )}
          </div>
          {allowUpload && !readOnly && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              <FileUp className="size-3.5" />
              <span>Explorar archivos</span>
            </button>
          )}
        </div>
      )}

      {/* Hidden universal file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="*/*"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
        className="hidden"
      />

      {/* Drop Zone Box */}
      {allowUpload && !readOnly && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer select-none ${
            isDragging
              ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_25px_rgba(6,182,212,0.25)] scale-[1.01]'
              : 'border-border/80 hover:border-cyan-500/60 bg-secondary/15 hover:bg-secondary/30'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              <Loader2 className="size-7 animate-spin text-cyan-500" />
              <span>Subiendo archivos de forma segura...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className={`size-12 rounded-2xl flex items-center justify-center transition-colors ${
                  isDragging ? 'bg-cyan-500 text-white' : 'bg-cyan-500/10 text-cyan-500'
                }`}
              >
                <UploadCloud className={`size-6 ${isDragging ? 'animate-bounce' : ''}`} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">
                  {isDragging ? '¡Suelta los archivos aquí!' : 'Arrastra y suelta archivos de todo tipo'}
                </p>
                <p className="text-[11px] text-muted-foreground max-w-md">
                  {description}
                </p>
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-mono text-muted-foreground/80">
                <span className="px-1.5 py-0.5 rounded bg-card border border-border">PDF / Docs</span>
                <span className="px-1.5 py-0.5 rounded bg-card border border-border">Logs / Dumps</span>
                <span className="px-1.5 py-0.5 rounded bg-card border border-border">Imágenes</span>
                <span className="px-1.5 py-0.5 rounded bg-card border border-border">ZIP / Tar</span>
                <span className="px-1.5 py-0.5 rounded bg-card border border-border">Scripts / Config</span>
                <span className="px-1.5 py-0.5 rounded bg-card border border-border">Todos los formatos</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Files List View */}
      {totalAttachments > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* 1. Existing Attachments (Persisted on Server) */}
          {(Array.isArray(existingAttachments) ? existingAttachments : [])
            .filter((att) => att && typeof att === 'object' && (att.filename || att.id))
            .map((att) => {
              const fileName = att.filename || 'archivo'
              const fileSize = typeof att.fileSize === 'number' ? att.fileSize : 0
              const info = getFileInfo(fileName, att.fileType)
              const Icon = info.icon

              return (
                <div
                  key={att.id || Math.random()}
                  className="group relative flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 p-3 shadow-sm hover:border-cyan-500/50 hover:shadow-md transition backdrop-blur-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${info.bgColor} ${info.borderColor} ${info.color}`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p
                        className="text-xs font-bold text-foreground truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition"
                        title={fileName}
                      >
                        {fileName}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                        <span>{formatFileSize(fileSize)}</span>
                        <span>·</span>
                        <span className={`px-1.5 py-0.2 rounded border text-[9px] font-semibold ${info.badgeClass}`}>
                          {info.badge}
                        </span>
                      </div>
                    </div>
                  </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Preview (if image or pdf) */}
                  {(info.category === 'image' || info.category === 'pdf') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewItem({ name: att.filename, url: att.fileUrl, category: info.category })
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10 transition"
                      title="Vista Previa"
                    >
                      <Eye className="size-3.5" />
                    </button>
                  )}

                  {/* Direct Download */}
                  <a
                    href={`/api/attachments/${att.id}/download`}
                    download={att.filename}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10 transition"
                    title="Descargar Archivo"
                  >
                    <Download className="size-3.5" />
                  </a>

                  {/* Delete (if allowed) */}
                  {!readOnly && onAttachmentDeleted && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteExisting(att.id)
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Eliminar Adjunto"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* 2. Staged Files (Pending Submit) */}
          {(Array.isArray(stagedFiles) ? stagedFiles : [])
            .filter((staged) => staged && typeof staged === 'object')
            .map((staged) => {
              const fileName = staged.name || staged.file?.name || 'captura.png'
              const fileSize = typeof staged.size === 'number' ? staged.size : (staged.file?.size || 0)
              const fileType = staged.type || staged.file?.type || 'image/png'
              const info = getFileInfo(fileName, fileType)
              const Icon = info.icon

              return (
                <div
                  key={staged.id || Math.random()}
                  className="group relative flex items-center justify-between gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3 shadow-sm transition backdrop-blur-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${info.bgColor} ${info.borderColor} ${info.color}`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-foreground truncate" title={fileName}>
                          {fileName}
                        </p>
                        <span className="rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-bold px-1 uppercase shrink-0">
                          Listo
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                        <span>{formatFileSize(fileSize)}</span>
                      <span>·</span>
                      <span className={`px-1.5 py-0.2 rounded border text-[9px] font-semibold ${info.badgeClass}`}>
                        {info.badge}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {staged.previewUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewItem({
                          name: staged.name,
                          url: staged.previewUrl!,
                          category: info.category,
                        })
                      }
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10 transition"
                      title="Vista Previa"
                    >
                      <Eye className="size-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveStaged(staged.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition"
                    title="Quitar"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Preview Modal for Images / PDFs */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-card p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm truncate max-w-md">
                    {previewItem.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewItem.url}
                    download={previewItem.name}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-secondary transition"
                  >
                    <Download className="size-3" />
                    <span>Descargar</span>
                  </a>
                  <button
                    onClick={() => setPreviewItem(null)}
                    className="rounded-lg p-1 text-muted-foreground hover:text-foreground transition"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex items-center justify-center max-h-[70vh] overflow-auto rounded-xl bg-background/50 p-2">
                {previewItem.category === 'image' ? (
                  <img
                    src={previewItem.url}
                    alt={previewItem.name}
                    className="max-h-[65vh] w-auto rounded-lg object-contain"
                  />
                ) : (
                  <iframe
                    src={previewItem.url}
                    title={previewItem.name}
                    className="w-full h-[65vh] rounded-lg border border-border"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
