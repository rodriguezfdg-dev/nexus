import { NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDatabase()
    const { id } = await params
    const cleanId = id.startsWith('#') ? id : `#${id}`

    const result = await db.execute({
      sql: 'SELECT * FROM incidents WHERE id = ? OR id = ? LIMIT 1',
      args: [cleanId, cleanId.replace('#', '')],
    })

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    const row: any = result.rows[0]
    const incident = {
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
      aiCopilot: row.ai_copilot_json ? JSON.parse(row.ai_copilot_json) : null,
      timeline: row.timeline_json ? JSON.parse(row.timeline_json) : [],
      attachments: row.attachments_json ? JSON.parse(row.attachments_json) : [],
    }

    return NextResponse.json(incident)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Add timeline event or note to an incident
  try {
    await initDatabase()
    const { id } = await params
    const body = await request.json()
    const cleanId = id.startsWith('#') ? id : `#${id}`

    const result = await db.execute({
      sql: 'SELECT timeline_json FROM incidents WHERE id = ? OR id = ? LIMIT 1',
      args: [cleanId, cleanId.replace('#', '')],
    })

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    const existingTimeline = result.rows[0].timeline_json
      ? JSON.parse(result.rows[0].timeline_json as string)
      : []

    const newEvent = {
      id: `evt-${Date.now()}`,
      type: body.type || 'internal_note',
      author: body.author || { name: 'Operator', role: 'SRE', initials: 'OP' },
      timestamp: 'Just now',
      content: body.content,
      metadata: body.metadata,
    }

    const updatedTimeline = [...existingTimeline, newEvent]

    await db.execute({
      sql: 'UPDATE incidents SET timeline_json = ? WHERE id = ? OR id = ?',
      args: [JSON.stringify(updatedTimeline), cleanId, cleanId.replace('#', '')],
    })

    return NextResponse.json({ success: true, event: newEvent })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDatabase()
    const { id } = await params
    const body = await request.json()
    const cleanId = id.startsWith('#') ? id : `#${id}`
    const rawId = cleanId.replace('#', '')

    const { title, status, priority, service, env, tag, assignedToMe, assignee } = body

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

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating incident in SQLite:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDatabase()
    const { id } = await params
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
    console.error('Error deleting incident in SQLite:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
