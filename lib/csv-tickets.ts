/**
 * Utilidades para importar tickets desde CSV.
 * Código puro (sin dependencias de servidor) para poder usarse en cliente y servidor.
 */

import type { IncidentStatus, Priority } from '@/lib/data-context'

export const MAX_IMPORT_ROWS = 1000

/** Normaliza texto: minúsculas, sin acentos, espacios colapsados. */
export function normalizeText(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Detecta el delimitador (coma, punto y coma o tabulador) a partir de la primera línea. */
export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] || ''
  const candidates = [',', ';', '\t']
  let best = ','
  let bestCount = -1
  for (const d of candidates) {
    // Contar fuera de comillas
    let count = 0
    let inQuotes = false
    for (const ch of firstLine) {
      if (ch === '"') inQuotes = !inQuotes
      else if (ch === d && !inQuotes) count++
    }
    if (count > bestCount) {
      best = d
      bestCount = count
    }
  }
  return best
}

/**
 * Parser CSV compatible con RFC 4180: soporta comillas, comillas escapadas ("")
 * y saltos de línea dentro de campos entrecomillados.
 */
export function parseCsv(input: string, delimiter?: string): string[][] {
  const text = (input || '').replace(/^﻿/, '') // quitar BOM de Excel
  const delim = delimiter || detectDelimiter(text)
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
    } else if (ch === delim) {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  // Descartar filas completamente vacías
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

export type TicketCsvField = 'title' | 'description' | 'assignee' | 'status' | 'priority' | 'section'

const HEADER_ALIASES: Record<TicketCsvField, string[]> = {
  title: ['titulo', 'title', 'asunto', 'nombre'],
  description: ['descripcion', 'description', 'detalle', 'detalles'],
  assignee: ['encargado', 'asignado', 'asignado a', 'responsable', 'assignee', 'tecnico', 'usuario asignado'],
  status: ['estado', 'status'],
  priority: ['prioridad', 'priority'],
  section: ['seccion', 'departamento', 'servicio', 'section', 'service', 'area'],
}

/** Mapea los índices de columna del encabezado a los campos conocidos. */
export function mapHeaders(headers: string[]): { map: Partial<Record<TicketCsvField, number>>; unknown: string[] } {
  const map: Partial<Record<TicketCsvField, number>> = {}
  const unknown: string[] = []
  headers.forEach((h, idx) => {
    const norm = normalizeText(h)
    const field = (Object.keys(HEADER_ALIASES) as TicketCsvField[]).find((f) => HEADER_ALIASES[f].includes(norm))
    if (field && map[field] === undefined) map[field] = idx
    else if (norm) unknown.push(h.trim())
  })
  return { map, unknown }
}

const STATUS_ALIASES: Record<IncidentStatus, string[]> = {
  Open: ['open', 'abierto', 'abierta', 'pendiente', 'pendientes', 'nuevo', 'nueva', 'por hacer'],
  'In Progress': ['in progress', 'en proceso', 'en progreso', 'en curso', 'trabajando', 'progreso'],
  Blocked: ['blocked', 'bloqueado', 'bloqueada', 'en revision', 'revision', 'en espera'],
  Resolved: ['resolved', 'resuelto', 'resuelta', 'cerrado', 'cerrada', 'closed', 'finalizado', 'finalizada', 'completado', 'cerrados resueltos'],
}

const PRIORITY_ALIASES: Record<Priority, string[]> = {
  Critical: ['critical', 'critica', 'critico', 'urgente'],
  High: ['high', 'alta', 'alto'],
  Medium: ['medium', 'media', 'medio', 'normal'],
  Low: ['low', 'baja', 'bajo'],
}

/** Devuelve el estado interno, 'Open' si viene vacío, o null si no se reconoce. */
export function parseStatus(value: string): IncidentStatus | null {
  const norm = normalizeText(value).replace(/\//g, ' ').replace(/\s+/g, ' ')
  if (!norm) return 'Open'
  const found = (Object.keys(STATUS_ALIASES) as IncidentStatus[]).find((s) => STATUS_ALIASES[s].includes(norm))
  return found || null
}

/** Devuelve la prioridad interna, 'Medium' si viene vacía, o null si no se reconoce. */
export function parsePriority(value: string): Priority | null {
  const norm = normalizeText(value)
  if (!norm) return 'Medium'
  const found = (Object.keys(PRIORITY_ALIASES) as Priority[]).find((p) => PRIORITY_ALIASES[p].includes(norm))
  return found || null
}

export const STATUS_LABELS_ES: Record<IncidentStatus, string> = {
  Open: 'Pendiente',
  'In Progress': 'En Proceso',
  Blocked: 'En Revisión',
  Resolved: 'Cerrado',
}

export const PRIORITY_LABELS_ES: Record<Priority, string> = {
  Critical: 'Crítica',
  High: 'Alta',
  Medium: 'Media',
  Low: 'Baja',
}

export const CSV_TEMPLATE =
  'titulo,descripcion,encargado,estado,prioridad,seccion\r\n' +
  '"No funciona la impresora del 2do piso","La impresora HP muestra error de papel atascado, ya se revisó la bandeja",Francisco,Pendiente,Media,Soporte TI\r\n' +
  '"Alta de usuario en sistema contable","Crear usuario para nueva colaboradora de Cobranzas",,En Proceso,Alta,Cobranzas\r\n' +
  '"Revisar lentitud de VPN","Varios usuarios reportan cortes al conectarse desde casa",francisco@empresa.com,En Revisión,Crítica,Soporte TI\r\n'

/** Resultado de validación por fila (lo devuelve la API). */
export interface ImportRowResult {
  line: number
  title: string
  description: string
  assigneeName: string
  status: IncidentStatus | null
  priority: Priority | null
  section: string
  errors: string[]
  warnings: string[]
  ticketId?: string
}

export interface ImportResponse {
  dryRun: boolean
  total: number
  valid: number
  invalid: number
  imported: number
  headerWarnings: string[]
  rows: ImportRowResult[]
  error?: string
}
