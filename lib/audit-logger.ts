import { db, initDatabase } from '@/lib/db'

export interface TicketAuditEvent {
  id: string
  ticketId: string
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
  metadata?: Record<string, any>
}

/**
 * Registra un evento de trazabilidad y auditoría de un ticket en la base de datos.
 */
export async function recordTicketAuditEvent(params: {
  ticketId: string
  action: 'creacion' | 'cambio_estado' | 'asignacion' | 'edicion' | 'cierre'
  previousStatus?: string | null
  newStatus?: string | null
  previousAssignee?: string | null
  newAssignee?: string | null
  actorName: string
  actorEmail?: string | null
  details?: string
  createdAt?: string
  durationSeconds?: number
  metadata?: Record<string, any>
}): Promise<string> {
  await initDatabase()

  const id = `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
  const cleanTicketId = params.ticketId.startsWith('#') ? params.ticketId : `#${params.ticketId}`
  const now = params.createdAt || new Date().toISOString()

  let calculatedDuration = params.durationSeconds ?? 0

  // Si no se proporcionó duración, intentar calcularla respecto al último evento registrado del ticket
  if (calculatedDuration === 0 && (params.action === 'cambio_estado' || params.action === 'cierre')) {
    try {
      const lastEventRes = await db.execute({
        sql: 'SELECT created_at FROM ticket_audit_events WHERE ticket_id = ? ORDER BY created_at DESC LIMIT 1',
        args: [cleanTicketId],
      })
      if (lastEventRes.rows.length > 0 && lastEventRes.rows[0].created_at) {
        const lastTime = new Date(String(lastEventRes.rows[0].created_at)).getTime()
        const diffSeconds = Math.max(0, Math.floor((new Date(now).getTime() - lastTime) / 1000))
        if (!isNaN(diffSeconds)) {
          calculatedDuration = diffSeconds
        }
      }
    } catch {}
  }

  // Generar descripción en español si no se proporcionó
  let detailsText = params.details
  if (!detailsText) {
    switch (params.action) {
      case 'creacion':
        detailsText = `Ticket creado por ${params.actorName} en estado inicial ${params.newStatus || 'Pendiente'}`
        break
      case 'cambio_estado':
        detailsText = `Estado actualizado de "${params.previousStatus || 'Pendiente'}" a "${params.newStatus || 'En Proceso'}" por ${params.actorName}`
        break
      case 'asignacion':
        detailsText = `Asignado a "${params.newAssignee || 'Técnico'}" (Anterior: ${params.previousAssignee || 'Sin Asignar'}) por ${params.actorName}`
        break
      case 'cierre':
        detailsText = `Ticket resuelto y cerrado por ${params.actorName}`
        break
      case 'edicion':
        detailsText = `Detalles del ticket actualizados por ${params.actorName}`
        break
      default:
        detailsText = `Evento de auditoría registrado por ${params.actorName}`
    }
  }

  await db.execute({
    sql: `INSERT INTO ticket_audit_events (
      id, ticket_id, action, previous_status, new_status,
      previous_assignee, new_assignee, actor_name, actor_email,
      details, created_at, duration_seconds, metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      cleanTicketId,
      params.action,
      params.previousStatus || null,
      params.newStatus || null,
      params.previousAssignee || null,
      params.newAssignee || null,
      params.actorName,
      params.actorEmail || null,
      detailsText,
      now,
      calculatedDuration,
      params.metadata ? JSON.stringify(params.metadata) : null,
    ],
  })

  return id
}

/**
 * Seeding retroactivo automático: Si la tabla de auditoría está vacía,
 * extrae los tickets existentes y genera su historial de trazabilidad.
 */
export async function seedTicketAuditIfEmpty() {
  await initDatabase()
  try {
    const countRes = await db.execute('SELECT COUNT(*) as count FROM ticket_audit_events')
    const count = Number(countRes.rows[0]?.count || 0)
    if (count > 0) return

    // Consultar todos los tickets actuales
    const incidentsRes = await db.execute('SELECT * FROM incidents ORDER BY rowid ASC')
    if (incidentsRes.rows.length === 0) return

    for (const row of incidentsRes.rows as any[]) {
      const ticketId = row.id
      const actorName = row.reporter_name || 'Operador del Sistema'
      const actorEmail = row.reporter_email || null
      const createdTime = new Date(Date.now() - 3600 * 1000 * Math.floor(2 + Math.random() * 48)).toISOString()

      // 1. Evento de creación
      await recordTicketAuditEvent({
        ticketId,
        action: 'creacion',
        newStatus: 'Open',
        actorName,
        actorEmail,
        details: `Ticket registrado por ${actorName} (${row.service || 'Soporte General'})`,
        createdAt: createdTime,
      })

      // 2. Si tiene asignado
      if (row.assignee_name && row.assignee_name !== 'Sin Asignar' && row.assignee_name !== 'Unassigned') {
        const assignTime = new Date(new Date(createdTime).getTime() + 600 * 1000).toISOString()
        await recordTicketAuditEvent({
          ticketId,
          action: 'asignacion',
          previousAssignee: 'Sin Asignar',
          newAssignee: row.assignee_name,
          actorName: 'Administrador TI',
          details: `Ticket asignado al especialista ${row.assignee_name}`,
          createdAt: assignTime,
        })
      }

      // 3. Si su estado actual ha progresado más allá de Open
      if (row.status && row.status !== 'Open') {
        const isResolved = row.status === 'Resolved' || row.status === 'Closed'
        const inProgTime = new Date(new Date(createdTime).getTime() + 1800 * 1000).toISOString()

        if (row.status === 'In Progress') {
          await recordTicketAuditEvent({
            ticketId,
            action: 'cambio_estado',
            previousStatus: 'Open',
            newStatus: 'In Progress',
            actorName: row.assignee_name && row.assignee_name !== 'Unassigned' ? row.assignee_name : 'Operador TI',
            details: `Ticket atendido y puesto en proceso de diagnóstico`,
            createdAt: inProgTime,
            durationSeconds: 1800,
          })
        } else if (row.status === 'Blocked') {
          await recordTicketAuditEvent({
            ticketId,
            action: 'cambio_estado',
            previousStatus: 'In Progress',
            newStatus: 'Blocked',
            actorName: row.assignee_name && row.assignee_name !== 'Unassigned' ? row.assignee_name : 'Operador TI',
            details: `Ticket puesto en estado de revisión y espera técnica`,
            createdAt: inProgTime,
            durationSeconds: 3600,
          })
        } else if (isResolved) {
          const resTime = new Date(new Date(createdTime).getTime() + 7200 * 1000).toISOString()
          await recordTicketAuditEvent({
            ticketId,
            action: 'cierre',
            previousStatus: 'In Progress',
            newStatus: 'Resolved',
            actorName: row.assignee_name && row.assignee_name !== 'Unassigned' ? row.assignee_name : 'Operador TI',
            details: `Incidencia solucionada satisfactoriamente y cerrada en el sistema`,
            createdAt: resTime,
            durationSeconds: 5400,
          })
        }
      }
    }
  } catch (err) {
    console.error('Error al inicializar trazabilidad retroactiva:', err)
  }
}
