import { NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'

export async function GET() {
  try {
    await initDatabase()
    const result = await db.execute('SELECT * FROM roles ORDER BY rowid ASC')
    const roles = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      department: row.department,
      color: row.color,
      created_at: row.created_at,
    }))
    return NextResponse.json(roles)
  } catch (error: any) {
    console.error('Error fetching roles:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await initDatabase()
    const body = await request.json()
    const { name, description, department, color } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre del rol es requerido' }, { status: 400 })
    }

    const id = `role-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`
    const createdAt = new Date().toISOString()
    const roleColor = color || 'cyan'
    const roleDept = department || 'General'

    await db.execute({
      sql: 'INSERT INTO roles (id, name, description, department, color, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, name.trim(), description?.trim() || '', roleDept.trim(), roleColor, createdAt],
    })

    const newRole = {
      id,
      name: name.trim(),
      description: description?.trim() || '',
      department: roleDept.trim(),
      color: roleColor,
      created_at: createdAt,
    }

    return NextResponse.json({ success: true, role: newRole }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating role:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    await initDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing role id' }, { status: 400 })
    }

    await db.execute({
      sql: 'DELETE FROM roles WHERE id = ?',
      args: [id],
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting role:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
