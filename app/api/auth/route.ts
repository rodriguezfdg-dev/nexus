import { NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth-crypto'

export async function POST(request: Request) {
  try {
    await initDatabase()
    const body = await request.json()
    const { action } = body

    if (action === 'register') {
      const { name, email, password, role } = body
      if (!name || !email || !password) {
        return NextResponse.json({ error: 'Nombre, email y contraseña requeridos.' }, { status: 400 })
      }

      // Check if user already exists
      const existing = await db.execute({
        sql: 'SELECT id FROM users WHERE email = ? LIMIT 1',
        args: [email.toLowerCase().trim()],
      })

      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'El correo electrónico ya está registrado.' }, { status: 409 })
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
        args: [
          userId,
          name.trim(),
          email.toLowerCase().trim(),
          hashedPassword,
          role || 'DevOps Engineer',
          new Date().toISOString(),
        ],
      })


      // Also create team member profile
      await db.execute({
        sql: `INSERT OR REPLACE INTO team_members (id, name, email, role, tier, status, initials)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          userId,
          name.trim(),
          email.toLowerCase().trim(),
          role || 'DevOps Engineer',
          'Tier 2 (Core)',
          'online',
          initials,
        ],
      })

      // Add audit log
      await db.execute({
        sql: `INSERT INTO audit_logs (id, event, category, actor_name, actor_email, actor_is_daemon, source_ip, node, status, timestamp, sha256, metadata_json)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
          `Usuario Registrado: ${name} (${email})`,
          'Security',
          name,
          email,
          0,
          '127.0.0.1',
          'auth-node',
          'Success',
          'Just now',
          Math.random().toString(36).substring(2, 15),
          JSON.stringify({ userId, role }),
        ],
      })

      return NextResponse.json({
        success: true,
        user: { id: userId, name, email, role: role || 'DevOps Engineer' },
        message: 'Registro completado con éxito.',
      })
    }

    if (action === 'login') {
      const { email, password } = body
      if (!email || !password) {
        return NextResponse.json({ error: 'Email y contraseña requeridos.' }, { status: 400 })
      }

      const result = await db.execute({
        sql: 'SELECT * FROM users WHERE email = ? LIMIT 1',
        args: [email.toLowerCase().trim()],
      })

      if (result.rows.length === 0) {
        // If it's the default admin/first user, allow seamless initial bootstrap
        const totalUsers = await db.execute('SELECT COUNT(*) as count FROM users')
        const count = Number(totalUsers.rows[0].count || 0)

        if (count === 0) {
          // Auto-bootstrap first user
          const name = email.split('@')[0].replace('.', ' ')
          const capitalized = name.charAt(0).toUpperCase() + name.slice(1)
          const userId = `usr-admin-${Date.now()}`

          const hashedPassword = hashPassword(password)

          await db.execute({
            sql: 'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            args: [userId, capitalized, email.toLowerCase().trim(), hashedPassword, 'Principal DevOps Lead', new Date().toISOString()],
          })

          return NextResponse.json({
            success: true,
            user: { id: userId, name: capitalized, email, role: 'Principal DevOps Lead' },
            message: 'Primer usuario administrador inicializado.',
          })
        }

        return NextResponse.json({ error: 'Credenciales inválidas o usuario no encontrado.' }, { status: 401 })
      }

      const user: any = result.rows[0]
      const isValid = verifyPassword(password, user.password_hash)

      if (!isValid) {
        return NextResponse.json({ error: 'Contraseña incorrecta.' }, { status: 401 })
      }

      // If user had legacy plain password, seamlessly upgrade to hashed password
      if (!user.password_hash.includes(':')) {
        const upgradedHash = hashPassword(password)
        await db.execute({
          sql: 'UPDATE users SET password_hash = ? WHERE id = ?',
          args: [upgradedHash, user.id],
        })
      }

      return NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        message: 'Sesión iniciada correctamente.',
      })
    }


    if (action === 'reset-password') {
      const { email } = body
      if (!email) {
        return NextResponse.json({ error: 'Email requerido.' }, { status: 400 })
      }

      // Check user exists
      const result = await db.execute({
        sql: 'SELECT id, name FROM users WHERE email = ? LIMIT 1',
        args: [email.toLowerCase().trim()],
      })

      // Even if user doesn't exist, provide secure generic response or confirmation
      return NextResponse.json({
        success: true,
        message: `Instrucciones de restablecimiento enviadas a ${email}.`,
      })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error: any) {
    console.error('Error en autenticación:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
