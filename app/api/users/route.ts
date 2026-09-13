import { NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'
import { hashPassword } from '@/lib/auth-crypto'

export async function GET() {
  try {
    await initDatabase()
    const result = await db.execute('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC')
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await initDatabase()
    const body = await request.json()
    const { name, email, role, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nombre, correo y contraseña requeridos' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ? LIMIT 1',
      args: [cleanEmail],
    })

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Ya existe un usuario con este correo' }, { status: 409 })
    }

    const userId = `usr-${Date.now()}`
    const initials = name
      .split(' ')
      .map((p: string) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'OP'

    const hashedPassword = hashPassword(password)

    await db.execute({
      sql: 'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [userId, name.trim(), cleanEmail, hashedPassword, role || 'Soporte TI', new Date().toISOString()],
    })


    await db.execute({
      sql: `INSERT OR REPLACE INTO team_members (id, name, email, role, tier, status, initials)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [userId, name.trim(), cleanEmail, role || 'Soporte TI', 'Tier 1', 'online', initials],
    })

    return NextResponse.json({
      success: true,
      user: { id: userId, name: name.trim(), email: cleanEmail, role: role || 'Soporte TI' },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    await initDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 })
    }

    await db.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [id],
    })

    await db.execute({
      sql: 'DELETE FROM team_members WHERE id = ?',
      args: [id],
    })

    return NextResponse.json({ success: true, message: 'Usuario eliminado' })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
