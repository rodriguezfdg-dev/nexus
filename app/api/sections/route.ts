import { NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'

export async function GET() {
  try {
    await initDatabase()
    try {
      await db.execute(
        "UPDATE sections SET name = 'Auditoría', description = '' WHERE LOWER(name) LIKE '%aditor%' OR LOWER(description) LIKE '%aditor%' OR LOWER(name) = 'auditoria' OR LOWER(description) = 'aditora'"
      )
      await db.execute(
        "UPDATE sections SET description = '' WHERE LOWER(TRIM(name)) = LOWER(TRIM(description))"
      )
    } catch {}
    const result = await db.execute('SELECT * FROM sections ORDER BY name ASC')
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error fetching sections:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await initDatabase()
    const body = await request.json()
    const { name, description, color } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre de la sección es obligatorio' }, { status: 400 })
    }

    const id = `sec-${Date.now()}`
    await db.execute({
      sql: 'INSERT INTO sections (id, name, description, color, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [id, name.trim(), description?.trim() || '', color || 'blue', new Date().toISOString()],
    })

    return NextResponse.json({
      success: true,
      section: { id, name: name.trim(), description: description?.trim() || '', color: color || 'blue' },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating section:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    await initDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID de sección requerido' }, { status: 400 })
    }

    await db.execute({
      sql: 'DELETE FROM sections WHERE id = ?',
      args: [id],
    })

    return NextResponse.json({ success: true, message: 'Sección eliminada con éxito' })
  } catch (error: any) {
    console.error('Error deleting section:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
