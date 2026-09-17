/**
 * Script de emergencia para listar usuarios y crear un SuperAdmin
 * Uso:
 *   node scripts/create-superadmin.js
 */
const { createClient } = require('@libsql/client')
const crypto = require('crypto')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'nexus.db')
const db = createClient({ url: `file:${dbPath.replace(/\\/g, '/')}` })

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derivedKey}`
}

async function main() {
  console.log('\n🔍 Consultando usuarios en nexus.db...')
  try {
    const res = await db.execute('SELECT id, name, email, role, status FROM users')
    if (res.rows.length > 0) {
      console.log('\n✅ Usuarios encontrados en tu base de datos:')
      console.table(res.rows)
    } else {
      console.log('\n⚠️ No hay usuarios registrados aún.')
    }

    // Crear o restablecer superusuario de emergencia
    const adminEmail = 'admin@nexus.local'
    const adminPass = 'admin123'
    const adminHash = hashPassword(adminPass)

    const existingAdmin = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [adminEmail],
    })

    if (existingAdmin.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO users (id, name, email, password_hash, role, status, created_at)
              VALUES ('usr-superadmin', 'Super Administrador', ?, ?, 'ti', 'activo', ?)`,
        args: [adminEmail, adminHash, new Date().toISOString()],
      })
      console.log('\n🚀 ¡Superusuario de emergencia CREADO exitosamente!')
    } else {
      await db.execute({
        sql: `UPDATE users SET password_hash = ?, role = 'ti', status = 'activo' WHERE email = ?`,
        args: [adminHash, adminEmail],
      })
      console.log('\n🔑 ¡Superusuario de emergencia ACTUALIZADO exitosamente!')
    }

    console.log('----------------------------------------------------')
    console.log('📧 Correo:     admin@nexus.local')
    console.log('🔐 Contraseña: admin123')
    console.log('👑 Rol:        ti (Acceso Total)')
    console.log('🟢 Estado:     activo')
    console.log('----------------------------------------------------\n')
    process.exit(0)
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

main()
