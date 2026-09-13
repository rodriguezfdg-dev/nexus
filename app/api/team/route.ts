import { NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'

export async function GET() {
  try {
    await initDatabase()
    const result = await db.execute('SELECT * FROM team_members ORDER BY rowid ASC')
    const members = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      tier: row.tier,
      status: row.status,
      initials: row.initials,
    }))
    return NextResponse.json(members)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await initDatabase()
    const body = await request.json()
    const id = body.id || `usr-${Date.now()}`
    const initials =
      body.initials ||
      body.name
        ?.split(' ')
        .map((p: string) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) ||
      'OP'

    await db.execute({
      sql: `INSERT INTO team_members (id, name, email, role, tier, status, initials)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        body.name,
        body.email,
        body.role || 'Engineer',
        body.tier || 'Tier 2 (Core)',
        body.status || 'online',
        initials,
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
    if (!id) return NextResponse.json({ error: 'Missing member id' }, { status: 400 })

    await db.execute({
      sql: 'DELETE FROM team_members WHERE id = ?',
      args: [id],
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
