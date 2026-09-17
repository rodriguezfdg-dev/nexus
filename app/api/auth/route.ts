import { NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth-crypto'
import { sendVerificationCodeEmail } from '@/lib/email-sender'

export async function POST(request: Request) {
  try {
    await initDatabase()
    const body = await request.json()
    const { action } = body

    if (action === 'register') {
      const { name, email, password } = body
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
      // New registered users are always created as 'usuario' and 'inactivo' until TI manually activates them
      const userRole = 'usuario'
      const userStatus = 'inactivo'

      // Generar código de verificación de 6 dígitos
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
      const codeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas

      await db.execute({
        sql: 'INSERT INTO users (id, name, email, password_hash, role, status, verification_code, verification_code_expires, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          userId,
          name.trim(),
          email.toLowerCase().trim(),
          hashedPassword,
          userRole,
          userStatus,
          verificationCode,
          codeExpires,
          new Date().toISOString(),
        ],
      })

      // Enviar correo con código de verificación de forma asíncrona sin bloquear
      sendVerificationCodeEmail(email.toLowerCase().trim(), name.trim(), verificationCode, 'registration').catch((err) => {
        console.error('Error enviando código de verificación al registrar:', err)
      })


      // Also create team member profile as inactive/offline
      await db.execute({
        sql: `INSERT OR REPLACE INTO team_members (id, name, email, role, tier, status, initials)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          userId,
          name.trim(),
          email.toLowerCase().trim(),
          'Usuario',
          'Tier 1',
          'offline',
          initials,
        ],
      })

      // Add audit log
      await db.execute({
        sql: `INSERT INTO audit_logs (id, event, category, actor_name, actor_email, actor_is_daemon, source_ip, node, status, timestamp, sha256, metadata_json)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
          `Usuario Registrado (Pendiente de Activación): ${name} (${email})`,
          'Security',
          name,
          email,
          0,
          '127.0.0.1',
          'auth-node',
          'Success',
          'Just now',
          Math.random().toString(36).substring(2, 15),
          JSON.stringify({ userId, role: userRole, status: userStatus }),
        ],
      })

      return NextResponse.json({
        success: true,
        user: { id: userId, name, email, role: userRole, status: userStatus },
        message: 'Cuenta registrada exitosamente. Tu cuenta está en estado inactivo hasta que un administrador de TI la active manualmente.',
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
            sql: 'INSERT INTO users (id, name, email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            args: [userId, capitalized, email.toLowerCase().trim(), hashedPassword, 'ti', 'activo', new Date().toISOString()],
          })

          const sessionUser = { id: userId, name: capitalized, email, role: 'ti', status: 'activo' }
          const res = NextResponse.json({
            success: true,
            user: sessionUser,
            message: 'Primer usuario administrador inicializado.',
          })
          res.cookies.set('nexus_session', JSON.stringify(sessionUser), {
            path: '/',
            httpOnly: false,
            maxAge: 60 * 60 * 24 * 7,
            sameSite: 'lax',
          })
          return res
        }

        return NextResponse.json({ error: 'Credenciales inválidas o usuario no encontrado.' }, { status: 401 })
      }

      const user: any = result.rows[0]
      const isValid = verifyPassword(password, user.password_hash)

      if (!isValid) {
        return NextResponse.json({ error: 'Contraseña incorrecta.' }, { status: 401 })
      }

      // Validar si la cuenta está activa
      if (user.status === 'inactivo' || user.status === 'inactive') {
        return NextResponse.json({
          error: 'Tu cuenta está inactiva o pendiente de activación por un administrador de TI.',
          code: 'ACCOUNT_INACTIVE',
        }, { status: 403 })
      }

      // If user had legacy plain password, seamlessly upgrade to hashed password
      if (!user.password_hash.includes(':')) {
        const upgradedHash = hashPassword(password)
        await db.execute({
          sql: 'UPDATE users SET password_hash = ? WHERE id = ?',
          args: [upgradedHash, user.id],
        })
      }

      const sessionUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || 'activo'
      }

      const res = NextResponse.json({
        success: true,
        user: sessionUser,
        message: 'Sesión iniciada correctamente.',
      })

      // Cookie for server and middleware route protection
      res.cookies.set('nexus_session', JSON.stringify(sessionUser), {
        path: '/',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      })

      return res
    }

    if (action === 'logout') {
      const res = NextResponse.json({ success: true, message: 'Sesión cerrada.' })
      res.cookies.delete('nexus_session')
      return res
    }


    if (action === 'reset-password' || action === 'request-reset') {
      const { email } = body
      if (!email) {
        return NextResponse.json({ error: 'Email requerido.' }, { status: 400 })
      }

      const cleanEmail = email.toLowerCase().trim()
      const result = await db.execute({
        sql: 'SELECT id, name FROM users WHERE email = ? LIMIT 1',
        args: [cleanEmail],
      })

      if (result.rows.length === 0) {
        return NextResponse.json({
          success: true,
          message: `Si la cuenta existe, se ha enviado un código de verificación a ${cleanEmail}.`,
        })
      }

      const user: any = result.rows[0]
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
      const codeExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString()

      await db.execute({
        sql: 'UPDATE users SET verification_code = ?, verification_code_expires = ? WHERE id = ?',
        args: [resetCode, codeExpires, user.id],
      })

      // Send email with reset code
      sendVerificationCodeEmail(cleanEmail, user.name, resetCode, 'password_reset').catch((err) => {
        console.error('Error enviando correo de reseteo:', err)
      })

      return NextResponse.json({
        success: true,
        message: `Código de verificación enviado a ${cleanEmail}.`,
      })
    }

    if (action === 'confirm-reset') {
      const { email, code, newPassword } = body
      if (!email || !code || !newPassword) {
        return NextResponse.json({ error: 'Correo, código de verificación y nueva contraseña son requeridos.' }, { status: 400 })
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' }, { status: 400 })
      }

      const cleanEmail = email.toLowerCase().trim()
      const cleanCode = code.toString().trim()

      const result = await db.execute({
        sql: 'SELECT id, name, verification_code FROM users WHERE email = ? LIMIT 1',
        args: [cleanEmail],
      })

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 })
      }

      const user: any = result.rows[0]

      if (!user.verification_code || user.verification_code !== cleanCode) {
        return NextResponse.json({ error: 'Código de verificación incorrecto.' }, { status: 400 })
      }

      const newHash = hashPassword(newPassword)
      await db.execute({
        sql: 'UPDATE users SET password_hash = ?, verification_code = NULL, verification_code_expires = NULL WHERE id = ?',
        args: [newHash, user.id],
      })

      return NextResponse.json({
        success: true,
        message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva clave.',
      })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error: any) {
    console.error('Error en autenticación:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
