import { NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'

export async function GET() {
  try {
    await initDatabase()

    const [incidentsRes, teamRes, runbooksRes, rulesRes, auditRes] = await Promise.all([
      db.execute('SELECT * FROM incidents'),
      db.execute('SELECT * FROM team_members'),
      db.execute('SELECT * FROM runbooks'),
      db.execute('SELECT * FROM automation_rules'),
      db.execute('SELECT * FROM audit_logs'),
    ])

    const backup = {
      exportedAt: new Date().toISOString(),
      incidents: incidentsRes.rows.map((row: any) => ({
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
      })),
      teamMembers: teamRes.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        tier: row.tier,
        status: row.status,
        initials: row.initials,
      })),
      runbooks: runbooksRes.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        category: row.category,
        summary: row.summary,
        tags: row.tags_json ? JSON.parse(row.tags_json) : [],
        reads: row.reads,
        lastUpdated: row.last_updated,
        author: {
          name: row.author_name,
          initials: row.author_initials,
          role: row.author_role,
        },
        steps: row.steps_json ? JSON.parse(row.steps_json) : [],
      })),
      automationRules: rulesRes.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        trigger: row.trigger_event,
        condition: row.condition_expr,
        action: row.action_expr,
        status: row.status,
        executionCountToday: Number(row.execution_count_today),
        lastTriggered: row.last_triggered,
        category: row.category,
      })),
      auditLogs: auditRes.rows.map((row: any) => ({
        id: row.id,
        event: row.event,
        category: row.category,
        actor: {
          name: row.actor_name,
          email: row.actor_email,
          isDaemon: Boolean(row.actor_is_daemon),
        },
        sourceIp: row.source_ip,
        node: row.node,
        status: row.status,
        timestamp: row.timestamp,
        sha256: row.sha256,
        metadata: row.metadata_json ? JSON.parse(row.metadata_json) : {},
      })),
    }

    return NextResponse.json(backup)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await initDatabase()
    const body = await request.json()
    const { action, data } = body

    if (action === 'clear') {
      await db.batch(
        [
          'DELETE FROM incidents',
          'DELETE FROM team_members',
          'DELETE FROM runbooks',
          'DELETE FROM automation_rules',
          'DELETE FROM audit_logs',
        ],
        'write'
      )
      return NextResponse.json({ success: true, message: 'All tables cleared in SQLite.' })
    }

    if (action === 'import' && data) {
      // Optional wipe before import
      if (body.wipeExisting) {
        await db.batch(
          [
            'DELETE FROM incidents',
            'DELETE FROM team_members',
            'DELETE FROM runbooks',
            'DELETE FROM automation_rules',
            'DELETE FROM audit_logs',
          ],
          'write'
        )
      }

      // Import Incidents
      if (Array.isArray(data.incidents)) {
        for (const inc of data.incidents) {
          await db.execute({
            sql: `INSERT OR REPLACE INTO incidents (
              id, title, priority, status, service, env,
              assignee_name, assignee_initials, assignee_status,
              reporter_name, reporter_email, reporter_org,
              sla_seconds_total, sla_seconds_remaining,
              ai_triaged, assigned_to_me, tag, created_time,
              ai_copilot_json, timeline_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              inc.id,
              inc.title,
              inc.priority || 'Medium',
              inc.status || 'Open',
              inc.service || 'Core-Service',
              inc.env || 'Production',
              inc.assignee?.name || 'Unassigned',
              inc.assignee?.initials || 'UN',
              inc.assignee?.status || 'online',
              inc.reporter?.name || 'Ops',
              inc.reporter?.email || 'ops@nexus.internal',
              inc.reporter?.organization || 'Enterprise',
              inc.slaSecondsTotal || 3600,
              inc.slaSecondsRemaining || 3600,
              inc.aiTriaged ? 1 : 0,
              inc.assignedToMe ? 1 : 0,
              inc.tag || 'General',
              inc.createdTime || 'Just now',
              JSON.stringify(inc.aiCopilot || null),
              JSON.stringify(inc.timeline || []),
            ],
          })
        }
      }

      // Import Team Members
      if (Array.isArray(data.teamMembers)) {
        for (const mem of data.teamMembers) {
          await db.execute({
            sql: `INSERT OR REPLACE INTO team_members (id, name, email, role, tier, status, initials)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
              mem.id,
              mem.name,
              mem.email,
              mem.role,
              mem.tier || 'Tier 2 (Core)',
              mem.status || 'online',
              mem.initials || 'OP',
            ],
          })
        }
      }

      // Import Runbooks
      if (Array.isArray(data.runbooks)) {
        for (const rb of data.runbooks) {
          await db.execute({
            sql: `INSERT OR REPLACE INTO runbooks (
              id, title, category, summary, tags_json, reads, last_updated,
              author_name, author_initials, author_role, steps_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              rb.id,
              rb.title,
              rb.category,
              rb.summary,
              JSON.stringify(rb.tags || []),
              rb.reads || '0',
              rb.lastUpdated || 'Today',
              rb.author?.name || 'Ops',
              rb.author?.initials || 'OP',
              rb.author?.role || 'Lead',
              JSON.stringify(rb.steps || []),
            ],
          })
        }
      }

      // Import Automation Rules
      if (Array.isArray(data.automationRules)) {
        for (const rule of data.automationRules) {
          await db.execute({
            sql: `INSERT OR REPLACE INTO automation_rules (
              id, name, description, trigger_event, condition_expr, action_expr,
              status, execution_count_today, last_triggered, category
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              rule.id,
              rule.name,
              rule.description,
              rule.trigger,
              rule.condition,
              rule.action,
              rule.status || 'active',
              rule.executionCountToday || 0,
              rule.lastTriggered || 'Never',
              rule.category || 'Triage',
            ],
          })
        }
      }

      return NextResponse.json({ success: true, message: 'Data imported into SQLite successfully.' })
    }

    return NextResponse.json({ error: 'Invalid migration request' }, { status: 400 })
  } catch (error: any) {
    console.error('Migration error in SQLite:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
