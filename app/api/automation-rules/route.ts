import { NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'

export async function GET() {
  try {
    await initDatabase()
    const result = await db.execute('SELECT * FROM automation_rules ORDER BY rowid DESC')
    const rules = result.rows.map((row: any) => ({
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
    }))
    return NextResponse.json(rules)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await initDatabase()
    const body = await request.json()
    const id = body.id || `RULE-${Math.floor(100 + Math.random() * 900)}`

    await db.execute({
      sql: `INSERT INTO automation_rules (
        id, name, description, trigger_event, condition_expr, action_expr,
        status, execution_count_today, last_triggered, category
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        body.name,
        body.description || '',
        body.trigger,
        body.condition,
        body.action,
        body.status || 'active',
        body.executionCountToday || 0,
        body.lastTriggered || 'Never',
        body.category || 'Triage',
      ],
    })

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await initDatabase()
    const body = await request.json()
    const { id, status } = body

    await db.execute({
      sql: 'UPDATE automation_rules SET status = ? WHERE id = ?',
      args: [status, id],
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    await initDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing rule id' }, { status: 400 })

    await db.execute({
      sql: 'DELETE FROM automation_rules WHERE id = ?',
      args: [id],
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
