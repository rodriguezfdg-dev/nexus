import { NextRequest, NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'
import { recordTicketAuditEvent } from '@/lib/audit-logger'
import { getAssigneeEmail, sendTicketAssignedEmail } from '@/lib/email-sender'
import {
  MAX_IMPORT_ROWS,
  ImportResponse,
  ImportRowResult,
  mapHeaders,
  normalizeText,
  parseCsv,
  parsePriority,
  parseStatus,
} from '@/lib/csv-tickets'

const UNASSIGNED = 'Sin Asignar'

function initialsOf(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'UN'
  )
}

function slaFor(priority: string) {
  return priority === 'Critical' ? 1800 : priority === 'High' ? 3600 : 14400
}

/**
 * POST /api/incidents/import
 * Body: { csv: string, dryRun?: boolean, notify?: boolean, reporter?: { name, email, organization } }
 *
 * - dryRun=true  → solo valida y devuelve el detalle por fila (vista previa).
 * - dryRun=false → inserta todas las filas válidas en una única transacción.
 */
export async function POST(request: NextRequest) {
  try {
    await initDatabase()
    const body = await request.json()
    const csvText: string = typeof body.csv === 'string' ? body.csv : ''
    const dryRun = body.dryRun !== false
    const notify = Boolean(body.notify)

    const fail = (msg: string, status = 400) =>
      NextResponse.json(
        { dryRun, total: 0, valid: 0, invalid: 0, imported: 0, headerWarnings: [], rows: [], error: msg } satisfies ImportResponse,
        { status }
      )

    if (!csvText.trim()) return fail('El archivo CSV está vacío.')

    const table = parseCsv(csvText)
    if (table.length < 2) return fail('El CSV debe tener una fila de encabezados y al menos un ticket.')

    const [headerRow, ...dataRows] = table
    const { map, unknown } = mapHeaders(headerRow)
    if (map.title === undefined) {
      return fail('No se encontró la columna obligatoria "titulo". Columnas esperadas: titulo, descripcion, encargado, estado.')
    }
    if (dataRows.length > MAX_IMPORT_ROWS) {
      return fail(`El CSV tiene ${dataRows.length} filas; el máximo por importación es ${MAX_IMPORT_ROWS}.`)
    }

    const headerWarnings: string[] = []
    if (unknown.length > 0) headerWarnings.push(`Columnas ignoradas: ${unknown.join(', ')}`)
    for (const [field, label] of [
      ['description', 'descripcion'],
      ['assignee', 'encargado'],
      ['status', 'estado'],
    ] as const) {
      if (map[field] === undefined) headerWarnings.push(`No hay columna "${label}"; se usará el valor por defecto.`)
    }

    // Catálogos para validar encargado y sección
    const [usersRes, teamRes, sectionsRes, idsRes] = await Promise.all([
      db.execute('SELECT name, email, status FROM users'),
      db.execute('SELECT name, email FROM team_members'),
      db.execute('SELECT name FROM sections ORDER BY rowid ASC'),
      db.execute('SELECT id FROM incidents'),
    ])

    const people = new Map<string, { name: string; email: string; inactive: boolean }>()
    const addPerson = (name: string, email: string, inactive: boolean) => {
      const entry = { name, email, inactive }
      if (name && !people.has(normalizeText(name))) people.set(normalizeText(name), entry)
      if (email && !people.has(normalizeText(email))) people.set(normalizeText(email), entry)
    }
    usersRes.rows.forEach((r: any) =>
      addPerson(String(r.name || ''), String(r.email || ''), r.status === 'inactivo' || r.status === 'inactive')
    )
    teamRes.rows.forEach((r: any) => addPerson(String(r.name || ''), String(r.email || ''), false))

    const sectionNames = sectionsRes.rows.map((r: any) => String(r.name))
    const sectionByNorm = new Map(sectionNames.map((n) => [normalizeText(n), n]))
    const defaultSection = sectionNames[0] || 'Soporte General'

    const cell = (row: string[], idx: number | undefined) => (idx === undefined ? '' : (row[idx] ?? '').trim())

    const rows: ImportRowResult[] = dataRows.map((row, i) => {
      const errors: string[] = []
      const warnings: string[] = []

      const title = cell(row, map.title)
      const description = cell(row, map.description)
      const rawAssignee = cell(row, map.assignee)
      const rawStatus = cell(row, map.status)
      const rawPriority = cell(row, map.priority)
      const rawSection = cell(row, map.section)

      if (!title) errors.push('Falta el título.')
      else if (title.length > 200) errors.push('El título supera los 200 caracteres.')

      const status = parseStatus(rawStatus)
      if (!status) errors.push(`Estado "${rawStatus}" no reconocido (usa Pendiente, En Proceso, En Revisión o Cerrado).`)

      const priority = parsePriority(rawPriority)
      if (!priority) errors.push(`Prioridad "${rawPriority}" no reconocida (usa Baja, Media, Alta o Crítica).`)

      let assigneeName = UNASSIGNED
      const normAssignee = normalizeText(rawAssignee)
      if (normAssignee && !['sin asignar', 'unassigned', 'ninguno', 'n/a', '-'].includes(normAssignee)) {
        const person = people.get(normAssignee)
        if (!person) errors.push(`Encargado "${rawAssignee}" no existe como usuario (usa su nombre o correo).`)
        else {
          assigneeName = person.name
          if (person.inactive) warnings.push(`El encargado "${person.name}" está inactivo.`)
        }
      }

      let section = defaultSection
      if (rawSection) {
        const match = sectionByNorm.get(normalizeText(rawSection))
        if (match) section = match
        else {
          section = rawSection
          warnings.push(`La sección "${rawSection}" no existe en el Panel de Control; se guardará igual.`)
        }
      }

      return {
        line: i + 2, // +1 por encabezado, +1 base 1
        title,
        description,
        assigneeName,
        status,
        priority,
        section,
        errors,
        warnings,
      }
    })

    const validRows = rows.filter((r) => r.errors.length === 0)

    if (dryRun || validRows.length === 0) {
      return NextResponse.json({
        dryRun: true,
        total: rows.length,
        valid: validRows.length,
        invalid: rows.length - validRows.length,
        imported: 0,
        headerWarnings,
        rows,
      } satisfies ImportResponse)
    }

    // ---- Importación real ----
    const sessionRaw = request.cookies.get('nexus_session')?.value
    let sessionUser: any = null
    try {
      sessionUser = sessionRaw ? JSON.parse(sessionRaw) : null
    } catch {}
    const reporterName = sessionUser?.name || body.reporter?.name || 'Importación CSV'
    const reporterEmail = sessionUser?.email || body.reporter?.email || 'soporte@nexus.io'
    const reporterOrg = sessionUser?.role || body.reporter?.organization || 'Sede Central'

    const usedIds = new Set(idsRes.rows.map((r: any) => String(r.id)))
    const newId = () => {
      for (let attempt = 0; attempt < 50; attempt++) {
        const candidate = `#NX-${Math.floor(1000 + Math.random() * 9000)}`
        if (!usedIds.has(candidate)) {
          usedIds.add(candidate)
          return candidate
        }
      }
      let candidate = ''
      do candidate = `#NX-${Math.floor(10000 + Math.random() * 90000)}`
      while (usedIds.has(candidate))
      usedIds.add(candidate)
      return candidate
    }

    const statements = validRows.map((r) => {
      const id = newId()
      r.ticketId = id
      const sla = slaFor(r.priority!)
      const copilot = {
        summary: `Automated diagnostic pipeline engaged for incident ${id}.`,
        rca: {
          diagnosis: `Telemetry triage in progress for ${r.section}.`,
          confidencePercent: 85,
          affectedComponent: r.section,
          remediationSteps: ['Verify service cluster health', 'Review error traces and ingress logs', 'Execute standard operating procedure'],
        },
        resolutionSteps: ['Analyzing error logs...', 'Checking connection pools...', 'Verifying service uptime...'],
      }
      const timeline = [
        {
          id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: 'system_event',
          author: { name: 'Nexus Monitor', role: 'Importación CSV', initials: 'NX' },
          timestamp: 'Justo ahora',
          content: `Ticket ${id} importado desde CSV por ${reporterName}.`,
        },
      ]
      const assigned = r.assigneeName !== UNASSIGNED
      return {
        sql: `INSERT INTO incidents (
          id, title, priority, status, service, env,
          assignee_name, assignee_initials, assignee_status,
          reporter_name, reporter_email, reporter_org,
          sla_seconds_total, sla_seconds_remaining,
          ai_triaged, assigned_to_me, tag, created_time,
          description, ai_copilot_json, timeline_json, attachments_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id, r.title, r.priority!, r.status!, r.section, 'Production',
          r.assigneeName, assigned ? initialsOf(r.assigneeName) : 'UN', 'online',
          reporterName, reporterEmail, reporterOrg,
          sla, sla,
          0, assigned ? 1 : 0, r.section, 'Justo ahora',
          r.description, JSON.stringify(copilot), JSON.stringify(timeline), '[]',
        ],
      }
    })

    // Una sola transacción: o se importan todas las filas válidas o ninguna
    await db.batch(statements, 'write')

    await db.execute({
      sql: `INSERT INTO audit_logs (id, event, category, actor_name, actor_email, actor_is_daemon, source_ip, node, status, timestamp, sha256, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        `Importación CSV: ${validRows.length} ticket(s) creados`,
        'Infrastructure',
        reporterName,
        reporterEmail,
        0,
        '127.0.0.1',
        'csv-import',
        'Success',
        'Justo ahora',
        Math.random().toString(36).substring(2, 15),
        JSON.stringify({ ticketIds: validRows.map((r) => r.ticketId) }),
      ],
    })

    // Trazabilidad por ticket (igual que la creación manual)
    for (const r of validRows) {
      const id = r.ticketId!
      await recordTicketAuditEvent({
        ticketId: id,
        action: 'creacion',
        newStatus: r.status,
        actorName: reporterName,
        actorEmail: reporterEmail,
        details: `Ticket importado desde CSV por ${reporterName} en servicio ${r.section} (${r.priority})`,
        metadata: { source: 'csv', line: r.line },
      }).catch((err) => console.error('Error registrando auditoría de importación:', err))

      if (r.assigneeName !== UNASSIGNED) {
        await recordTicketAuditEvent({
          ticketId: id,
          action: 'asignacion',
          previousAssignee: UNASSIGNED,
          newAssignee: r.assigneeName,
          actorName: reporterName,
          actorEmail: reporterEmail,
          details: `Asignación inicial (CSV) al especialista ${r.assigneeName}`,
        }).catch((err) => console.error('Error registrando auditoría de asignación:', err))

        if (notify) {
          getAssigneeEmail(r.assigneeName)
            .then((email) => {
              if (email && email.includes('@') && !email.endsWith('.internal')) {
                return sendTicketAssignedEmail({
                  toEmail: email,
                  assigneeName: r.assigneeName,
                  ticketId: id,
                  title: r.title,
                  priority: r.priority!,
                  service: r.section,
                  reporterName,
                  reporterEmail,
                })
              }
            })
            .catch((err) => console.error('Error enviando correo de asignación (CSV):', err))
        }
      }
    }

    return NextResponse.json(
      {
        dryRun: false,
        total: rows.length,
        valid: validRows.length,
        invalid: rows.length - validRows.length,
        imported: validRows.length,
        headerWarnings,
        rows,
      } satisfies ImportResponse,
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error importando tickets desde CSV:', error)
    return NextResponse.json({ error: error.message || 'Error interno al importar.' }, { status: 500 })
  }
}
