import { NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'

export async function GET() {
  try {
    await initDatabase()
    const result = await db.execute('SELECT * FROM runbooks ORDER BY rowid DESC')
    const runbooks = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      summary: row.summary,
      tags: row.tags_json ? JSON.parse(row.tags_json) : [],
      reads: row.reads || '0',
      lastUpdated: row.last_updated,
      author: {
        name: row.author_name,
        initials: row.author_initials,
        role: row.author_role,
      },
      steps: row.steps_json ? JSON.parse(row.steps_json) : [],
    }))
    return NextResponse.json(runbooks)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await initDatabase()
    const body = await request.json()
    const id = body.id || `RB-${Math.floor(100 + Math.random() * 900)}`

    await db.execute({
      sql: `INSERT INTO runbooks (
        id, title, category, summary, tags_json, reads, last_updated,
        author_name, author_initials, author_role, steps_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        body.title,
        body.category || 'General',
        body.summary || '',
        JSON.stringify(body.tags || []),
        body.reads || '0',
        body.lastUpdated || 'Just now',
        body.author?.name || 'DevOps Team',
        body.author?.initials || 'DO',
        body.author?.role || 'SRE',
        JSON.stringify(body.steps || []),
      ],
    })

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    await initDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing runbook id' }, { status: 400 })

    await db.execute({
      sql: 'DELETE FROM runbooks WHERE id = ?',
      args: [id],
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
