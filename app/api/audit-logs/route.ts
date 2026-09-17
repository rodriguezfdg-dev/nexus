import { NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'
import { seedTicketAuditIfEmpty, recordTicketAuditEvent } from '@/lib/audit-logger'

export async function GET(request: Request) {
  try {
    await initDatabase()
    await seedTicketAuditIfEmpty()

    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get('ticketId')
    const action = searchParams.get('action')
    const actor = searchParams.get('actor')
    const limit = Number(searchParams.get('limit')) || 300

    let query = 'SELECT * FROM ticket_audit_events'
    const conditions: string[] = []
    const args: any[] = []

    if (ticketId) {
      const cleanId = ticketId.startsWith('#') ? ticketId : `#${ticketId}`
      const rawId = cleanId.replace('#', '')
      conditions.push('(ticket_id = ? OR ticket_id = ?)')
      args.push(cleanId, rawId)
    }

    if (action && action !== 'all') {
      conditions.push('action = ?')
      args.push(action)
    }

    if (actor && actor !== 'all') {
      conditions.push('actor_name = ?')
      args.push(actor)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY created_at DESC LIMIT ?'
    args.push(limit)

    const result = await db.execute({ sql: query, args })

    // Also fetch incident titles to decorate the audit events
    const incidentsRes = await db.execute('SELECT id, title, service, priority, status FROM incidents')
    const incidentMap = new Map<string, any>()
    incidentsRes.rows.forEach((r: any) => {
      incidentMap.set(r.id, r)
      incidentMap.set(String(r.id).replace('#', ''), r)
    })

    const events = result.rows.map((row: any) => {
      const inc = incidentMap.get(row.ticket_id) || null
      return {
        id: row.id,
        ticketId: row.ticket_id,
        ticketTitle: inc?.title || 'Ticket de Soporte',
        ticketPriority: inc?.priority || 'Medium',
        ticketService: inc?.service || 'General',
        currentStatus: inc?.status || row.new_status,
        action: row.action,
        previousStatus: row.previous_status,
        newStatus: row.new_status,
        previousAssignee: row.previous_assignee,
        newAssignee: row.new_assignee,
        actorName: row.actor_name,
        actorEmail: row.actor_email,
        details: row.details,
        createdAt: row.created_at,
        durationSeconds: Number(row.duration_seconds || 0),
        metadata: row.metadata_json ? JSON.parse(row.metadata_json) : {},
      }
    })

    return NextResponse.json(events)
  } catch (error: any) {
    console.error('Error fetching ticket audit events:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = await recordTicketAuditEvent({
      ticketId: body.ticketId,
      action: body.action,
      previousStatus: body.previousStatus,
      newStatus: body.newStatus,
      previousAssignee: body.previousAssignee,
      newAssignee: body.newAssignee,
      actorName: body.actorName || 'Operador',
      actorEmail: body.actorEmail,
      details: body.details,
      createdAt: body.createdAt,
      durationSeconds: body.durationSeconds,
      metadata: body.metadata,
    })

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating ticket audit event:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
