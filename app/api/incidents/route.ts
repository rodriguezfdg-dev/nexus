import { NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'
import {
  getAssigneeEmail,
  sendTicketAssignedEmail,
  handleIncidentUpdatedNotifications,
} from '@/lib/email-sender'
import { recordTicketAuditEvent } from '@/lib/audit-logger'

export async function GET() {
  try {
    await initDatabase()
    const result = await db.execute('SELECT * FROM incidents ORDER BY rowid DESC')
    const incidents = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      priority: row.priority,
      status: row.status,
      service: row.service,
      env: row.env,
      assignee: {
        name: row.assignee_name,
        initials: row.assignee_initials,
        status: row.assignee_status,
      },
      reporter: {
        name: row.reporter_name,
        email: row.reporter_email,
        organization: row.reporter_org,
      },
      slaSecondsTotal: Number(row.sla_seconds_total),
      slaSecondsRemaining: Number(row.sla_seconds_remaining),
      aiTriaged: Boolean(row.ai_triaged),
      assignedToMe: Boolean(row.assigned_to_me),
      tag: row.tag,
      createdTime: row.created_time,
      description: row.description || '',
      aiCopilot: row.ai_copilot_json ? JSON.parse(row.ai_copilot_json) : null,
      timeline: row.timeline_json ? JSON.parse(row.timeline_json) : [],
      attachments: row.attachments_json ? JSON.parse(row.attachments_json) : [],
    }))

    return NextResponse.json(incidents)
  } catch (error: any) {
    console.error('Error fetching incidents from SQLite:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await initDatabase()
    const body = await request.json()

    const id = body.id || `#NX-${Math.floor(1000 + Math.random() * 9000)}`
    const title = body.title || 'Untitled Incident'
    const priority = body.priority || 'Medium'
    const status = body.status || 'Open'
    const service = body.service || 'Core-Platform'
    const env = body.env || 'Production'
    const assigneeName = body.assignee?.name || 'Unassigned'
    const assigneeInitials = body.assignee?.initials || 'UN'
    const assigneeStatus = body.assignee?.status || 'online'
    const reporterName = body.reporter?.name || 'Operations Team'
    const reporterEmail = body.reporter?.email || 'ops@nexus.internal'
    const reporterOrg = body.reporter?.organization || 'Internal Ops'
    const slaSecondsTotal = body.slaSecondsTotal ?? (priority === 'Critical' ? 1800 : 3600)
    const slaSecondsRemaining = body.slaSecondsRemaining ?? slaSecondsTotal
    const aiTriaged = body.aiTriaged ? 1 : 0
    const assignedToMe = body.assignedToMe ? 1 : 0
    const tag = body.tag || 'General'
    const createdTime = body.createdTime || 'Just now'
    const description = body.description || ''
    
    const defaultCopilot = {
      summary: `Automated diagnostic pipeline engaged for incident ${id}.`,
      rca: {
        diagnosis: `Telemetry triage in progress for ${service}.`,
        confidencePercent: 85,
        affectedComponent: service,
        remediationSteps: [
          'Verify service cluster health',
          'Review error traces and ingress logs',
          'Execute standard operating procedure',
        ],
      },
      resolutionSteps: [
        'Analyzing error logs...',
        'Checking connection pools...',
        'Verifying service uptime...',
      ],
    }

    const aiCopilotJson = JSON.stringify(body.aiCopilot || defaultCopilot)
    const defaultTimeline = [
      {
        id: `evt-${Date.now()}`,
        type: 'system_event',
        author: { name: 'Nexus Monitor', role: 'Telemetry Core', initials: 'NX' },
        timestamp: 'Just now',
        content: `Incident ${id} registered in ${env} environment for service ${service}.`,
      },
    ]
    const timelineJson = JSON.stringify(body.timeline || defaultTimeline)
    const attachmentsJson = JSON.stringify(body.attachments || [])

    await db.execute({
      sql: `INSERT INTO incidents (
        id, title, priority, status, service, env,
        assignee_name, assignee_initials, assignee_status,
        reporter_name, reporter_email, reporter_org,
        sla_seconds_total, sla_seconds_remaining,
        ai_triaged, assigned_to_me, tag, created_time,
        description,
        ai_copilot_json, timeline_json, attachments_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, title, priority, status, service, env,
        assigneeName, assigneeInitials, assigneeStatus,
        reporterName, reporterEmail, reporterOrg,
        slaSecondsTotal, slaSecondsRemaining,
        aiTriaged, assignedToMe, tag, createdTime,
        description,
        aiCopilotJson, timelineJson, attachmentsJson,
      ],
    })

    // Also register audit log
    await db.execute({
      sql: `INSERT INTO audit_logs (id, event, category, actor_name, actor_email, actor_is_daemon, source_ip, node, status, timestamp, sha256, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        `Incident Created: ${id} (${title})`,
        'Infrastructure',
        assigneeName,
        reporterEmail,
        0,
        '127.0.0.1',
        service,
        'Success',
        'Just now',
        Math.random().toString(36).substring(2, 15),
        JSON.stringify({ incidentId: id, priority, service }),
      ],
    })

    // Registrar auditoría de creación de ticket
    recordTicketAuditEvent({
      ticketId: id,
      action: 'creacion',
      newStatus: status,
      actorName: reporterName,
      actorEmail: reporterEmail,
      details: `Ticket registrado por ${reporterName} en servicio ${service} (${priority})`,
    }).catch((err) => console.error('Error registrando auditoría de creación:', err))

    // Notificación por correo al responsable asignado al crear el ticket
    if (assigneeName && assigneeName !== 'Sin Asignar' && assigneeName !== 'Unassigned') {
      recordTicketAuditEvent({
        ticketId: id,
        action: 'asignacion',
        previousAssignee: 'Sin Asignar',
        newAssignee: assigneeName,
        actorName: reporterName,
        actorEmail: reporterEmail,
        details: `Asignación inicial al especialista ${assigneeName}`,
      }).catch((err) => console.error('Error registrando auditoría de asignación inicial:', err))

      getAssigneeEmail(assigneeName).then((email) => {
        if (email && email.includes('@') && !email.endsWith('.internal')) {
          sendTicketAssignedEmail({
            toEmail: email,
            assigneeName,
            ticketId: id,
            title,
            priority,
            service,
            reporterName,
            reporterEmail,
          }).catch((err) => console.error('Error enviando correo de asignación en creación:', err))
        }
      }).catch((err) => console.error('Error buscando email del asignado:', err))
    }

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error: any) {
    console.error('Error inserting incident into SQLite:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await initDatabase()
    const body = await request.json()
    const { id, title, status, priority, service, env, tag, assignedToMe, assignee, description, updatedBy, updatedByEmail } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing incident id' }, { status: 400 })
    }

    const cleanId = id.startsWith('#') ? id : `#${id}`
    const rawId = cleanId.replace('#', '')

    // Obtener estado anterior para comparar cambios de estado o asignado
    const prevRes = await db.execute({
      sql: 'SELECT * FROM incidents WHERE id = ? OR id = ? LIMIT 1',
      args: [cleanId, rawId],
    })
    const prevIncident = prevRes.rows.length > 0 ? (prevRes.rows[0] as any) : null

    const updates: string[] = []
    const args: any[] = []

    if (title !== undefined) {
      updates.push('title = ?')
      args.push(title)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      args.push(status)
    }
    if (priority !== undefined) {
      updates.push('priority = ?')
      args.push(priority)
    }
    if (service !== undefined) {
      updates.push('service = ?')
      args.push(service)
    }
    if (env !== undefined) {
      updates.push('env = ?')
      args.push(env)
    }
    if (tag !== undefined) {
      updates.push('tag = ?')
      args.push(tag)
    }
    if (assignedToMe !== undefined) {
      updates.push('assigned_to_me = ?')
      args.push(assignedToMe ? 1 : 0)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      args.push(description)
    }
    if (assignee?.name) {
      updates.push('assignee_name = ?, assignee_initials = ?, assignee_status = ?')
      args.push(assignee.name, assignee.initials || 'UN', assignee.status || 'online')
    }

    if (updates.length > 0) {
      args.push(cleanId, rawId)
      await db.execute({
        sql: `UPDATE incidents SET ${updates.join(', ')} WHERE id = ? OR id = ?`,
        args,
      })
    }

    // Registrar trazabilidad de auditoría
    if (prevIncident) {
      const actorName = updatedBy || (assignee?.name && assignee.name !== 'Sin Asignar' ? assignee.name : 'Operador TI')
      const actorEmail = updatedByEmail || null

      // Cambio de estado / Cierre
      if (status && status !== prevIncident.status) {
        const isClosed = status === 'Resolved' || status === 'Closed'
        recordTicketAuditEvent({
          ticketId: cleanId,
          action: isClosed ? 'cierre' : 'cambio_estado',
          previousStatus: prevIncident.status,
          newStatus: status,
          actorName,
          actorEmail,
          details: isClosed
            ? `Ticket cerrado y resuelto por ${actorName}`
            : `Estado cambiado de "${prevIncident.status}" a "${status}" por ${actorName}`,
        }).catch((err) => console.error('Error registrando auditoría de estado:', err))
      }

      // Cambio de asignado
      if (assignee?.name && assignee.name !== prevIncident.assignee_name) {
        recordTicketAuditEvent({
          ticketId: cleanId,
          action: 'asignacion',
          previousAssignee: prevIncident.assignee_name,
          newAssignee: assignee.name,
          actorName,
          actorEmail,
          details: `Asignado a "${assignee.name}" (Anterior: "${prevIncident.assignee_name}")`,
        }).catch((err) => console.error('Error registrando auditoría de asignación:', err))
      }

      // Notificaciones por correo
      handleIncidentUpdatedNotifications({
        prevIncident,
        newStatus: status,
        newAssigneeName: assignee?.name,
        updatedTitle: title,
        updatedPriority: priority,
        updatedService: service,
      }).catch((err) => console.error('Error en notificaciones de actualización de incidente:', err))
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating incident in SQLite:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    await initDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing incident id' }, { status: 400 })
    }

    const cleanId = id.startsWith('#') ? id : `#${id}`
    const rawId = cleanId.replace('#', '')

    await db.execute({
      sql: 'DELETE FROM incidents WHERE id = ? OR id = ?',
      args: [cleanId, rawId],
    })

    await db.execute({
      sql: 'DELETE FROM attachments WHERE incident_id = ? OR incident_id = ?',
      args: [cleanId, rawId],
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
