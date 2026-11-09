'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Mail,
} from 'lucide-react'
import { useNexusData } from '@/lib/data-context'
import { useToast } from '@/components/nexus/toast-provider'
import {
  CSV_TEMPLATE,
  ImportResponse,
  MAX_IMPORT_ROWS,
  PRIORITY_LABELS_ES,
  STATUS_LABELS_ES,
} from '@/lib/csv-tickets'

export default function ImportTicketsPage() {
  const router = useRouter()
  const { refresh } = useNexusData()
  const { success, error } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fileName, setFileName] = useState('')
  const [csvText, setCsvText] = useState('')
  const [preview, setPreview] = useState<ImportResponse | null>(null)
  const [validating, setValidating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [notify, setNotify] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const getReporter = () => {
    try {
      const u = JSON.parse(localStorage.getItem('nexus_user') || 'null')
      return u ? { name: u.name, email: u.email, organization: u.role } : undefined
    } catch {
      return undefined
    }
  }

  const callApi = async (text: string, dryRun: boolean): Promise<ImportResponse> => {
    const res = await fetch('/api/incidents/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv: text, dryRun, notify, reporter: getReporter() }),
    })
    const data = await res.json()
    if (!res.ok && !data.rows) throw new Error(data.error || 'Error del servidor')
    return data
  }

  const readFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      error('Formato no válido', 'Selecciona un archivo .csv')
      return
    }
    // Intentar UTF-8; si aparecen caracteres inválidos, reintentar como Windows-1252 (Excel en español)
    const buffer = await file.arrayBuffer()
    let text = new TextDecoder('utf-8').decode(buffer)
    if (text.includes('�')) text = new TextDecoder('windows-1252').decode(buffer)

    setFileName(file.name)
    setCsvText(text)
    setPreview(null)
    setValidating(true)
    try {
      const result = await callApi(text, true)
      setPreview(result)
      if (result.error) error('CSV no válido', result.error)
    } catch (err: any) {
      error('Error al validar', err.message)
    } finally {
      setValidating(false)
    }
  }

  const handleImport = async () => {
    if (!csvText || !preview || preview.valid === 0) return
    setImporting(true)
    try {
      const result = await callApi(csvText, false)
      if (result.error) throw new Error(result.error)
      setPreview(result)
      await refresh()
      success(
        'Importación completada',
        `${result.imported} ticket(s) creados${result.invalid ? `, ${result.invalid} fila(s) omitidas por errores` : ''}.`
      )
      if (result.invalid === 0) router.push('/kanban')
    } catch (err: any) {
      error('Error al importar', err.message)
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    // BOM para que Excel abra correctamente los acentos
    const blob = new Blob(['﻿' + CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla-tickets.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setFileName('')
    setCsvText('')
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const imported = preview && !preview.dryRun

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <Link
            href="/kanban"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2 transition"
          >
            <ArrowLeft className="size-3.5" />
            <span>Volver al Tablero</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <FileSpreadsheet className="size-7 text-cyan-500" />
            <span>Importar Tickets desde CSV</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Carga varios tickets a la vez con título, descripción, encargado y estado.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition cursor-pointer"
        >
          <Download className="size-4 text-cyan-500" />
          Descargar plantilla CSV
        </button>
      </div>

      {/* Instrucciones */}
      <div className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-xl p-5 text-xs text-muted-foreground space-y-2">
        <p className="font-bold uppercase tracking-wider text-foreground">Formato del archivo</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Columnas: <code className="text-cyan-600 dark:text-cyan-400">titulo</code> (obligatoria),{' '}
            <code className="text-cyan-600 dark:text-cyan-400">descripcion</code>,{' '}
            <code className="text-cyan-600 dark:text-cyan-400">encargado</code>,{' '}
            <code className="text-cyan-600 dark:text-cyan-400">estado</code> y opcionalmente{' '}
            <code className="text-cyan-600 dark:text-cyan-400">prioridad</code> y{' '}
            <code className="text-cyan-600 dark:text-cyan-400">seccion</code>.
          </li>
          <li>
            <b>encargado</b>: nombre o correo de un usuario existente. Vacío = Sin Asignar.
          </li>
          <li>
            <b>estado</b>: Pendiente, En Proceso, En Revisión o Cerrado. Vacío = Pendiente.
          </li>
          <li>
            <b>prioridad</b>: Baja, Media, Alta o Crítica. Vacío = Media.
          </li>
          <li>Separador coma o punto y coma (Excel). Máximo {MAX_IMPORT_ROWS} filas por archivo.</li>
        </ul>
      </div>

      {/* Dropzone */}
      {!preview && (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const f = e.dataTransfer.files?.[0]
            if (f) readFile(f)
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition ${
            dragOver ? 'border-cyan-500 bg-cyan-500/10' : 'border-border hover:border-cyan-500/60 bg-card/40'
          }`}
        >
          {validating ? (
            <Loader2 className="size-10 text-cyan-500 animate-spin" />
          ) : (
            <Upload className="size-10 text-cyan-500" />
          )}
          <p className="text-sm font-semibold text-foreground">
            {validating ? `Validando ${fileName}...` : 'Arrastra tu archivo CSV aquí o haz clic para seleccionarlo'}
          </p>
          <p className="text-xs text-muted-foreground">Se mostrará una vista previa antes de crear los tickets.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) readFile(f)
            }}
          />
        </div>
      )}

      {/* Vista previa */}
      {preview && (
        <div className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileSpreadsheet className="size-4 text-cyan-500" />
              {fileName}
              <button
                type="button"
                onClick={reset}
                className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                title="Elegir otro archivo"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-bold">
              <span className="px-2 py-1 rounded-md bg-secondary border border-border">{preview.total} filas</span>
              <span className="px-2 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                {imported ? `${preview.imported} importadas` : `${preview.valid} válidas`}
              </span>
              {preview.invalid > 0 && (
                <span className="px-2 py-1 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400">
                  {preview.invalid} con errores
                </span>
              )}
            </div>
          </div>

          {preview.error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="size-4 shrink-0" />
              {preview.error}
            </div>
          )}
          {preview.headerWarnings.map((w) => (
            <div
              key={w}
              className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400"
            >
              <AlertTriangle className="size-4 shrink-0" />
              {w}
            </div>
          ))}

          {preview.rows.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3 py-2 text-left">Fila</th>
                    <th className="px-3 py-2 text-left">Título</th>
                    <th className="px-3 py-2 text-left">Descripción</th>
                    <th className="px-3 py-2 text-left">Encargado</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                    <th className="px-3 py-2 text-left">Prioridad</th>
                    <th className="px-3 py-2 text-left">Sección</th>
                    <th className="px-3 py-2 text-left">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preview.rows.map((r) => {
                    const hasErrors = r.errors.length > 0
                    return (
                      <tr key={r.line} className={hasErrors ? 'bg-rose-500/5' : ''}>
                        <td className="px-3 py-2 font-mono text-muted-foreground">{r.line}</td>
                        <td className="px-3 py-2 font-semibold text-foreground max-w-[220px] truncate" title={r.title}>
                          {r.title || '—'}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground max-w-[260px] truncate" title={r.description}>
                          {r.description || '—'}
                        </td>
                        <td className="px-3 py-2">{r.assigneeName}</td>
                        <td className="px-3 py-2">{r.status ? STATUS_LABELS_ES[r.status] : '—'}</td>
                        <td className="px-3 py-2">{r.priority ? PRIORITY_LABELS_ES[r.priority] : '—'}</td>
                        <td className="px-3 py-2">{r.section}</td>
                        <td className="px-3 py-2 min-w-[200px]">
                          {r.ticketId ? (
                            <Link
                              href={`/incidents/${r.ticketId.replace('#', '')}`}
                              className="inline-flex items-center gap-1 font-mono font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              <CheckCircle2 className="size-3.5" />
                              {r.ticketId}
                            </Link>
                          ) : hasErrors ? (
                            <ul className="space-y-0.5 text-rose-600 dark:text-rose-400">
                              {r.errors.map((e) => (
                                <li key={e} className="flex gap-1">
                                  <AlertCircle className="size-3.5 shrink-0 mt-px" />
                                  {e}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                              <CheckCircle2 className="size-3.5" /> Lista
                            </span>
                          )}
                          {r.warnings.map((w) => (
                            <p key={w} className="flex gap-1 text-amber-600 dark:text-amber-400 mt-0.5">
                              <AlertTriangle className="size-3.5 shrink-0 mt-px" />
                              {w}
                            </p>
                          ))}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/70">
            {!imported ? (
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                  className="accent-cyan-500"
                />
                <Mail className="size-3.5" />
                Enviar correo de asignación a cada encargado
              </label>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-3">
              {imported ? (
                <Link
                  href="/kanban"
                  className="quantum-gradient-btn flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-lg transition"
                >
                  Ver en el Tablero
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-xl border border-border px-5 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={importing || preview.valid === 0}
                    className="quantum-gradient-btn flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="size-4" />
                        Importar {preview.valid} ticket(s)
                        {preview.invalid > 0 ? ' válidos' : ''}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
