import { NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'

export async function GET() {
  try {
    await initDatabase()
    const result = await db.execute('SELECT * FROM audit_logs ORDER BY rowid DESC LIMIT 100')
    const logs = result.rows.map((row: any) => ({
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
    }))
    return NextResponse.json(logs)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await initDatabase()
    const body = await request.json()
    const id = body.id || `AUD-${Math.floor(1000 + Math.random() * 9000)}`

    await db.execute({
      sql: `INSERT INTO audit_logs (
        id, event, category, actor_name, actor_email, actor_is_daemon,
        source_ip, node, status, timestamp, sha256, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        body.event,
        body.category || 'Infrastructure',
        body.actor?.name || 'System',
        body.actor?.email || 'system@nexus.internal',
        body.actor?.isDaemon ? 1 : 0,
        body.sourceIp || '127.0.0.1',
        body.node || 'primary-node',
        body.status || 'Success',
        body.timestamp || 'Just now',
        body.sha256 || Math.random().toString(36).substring(2, 15),
        JSON.stringify(body.metadata || {}),
      ],
    })

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
