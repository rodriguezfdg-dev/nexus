import { createClient, Client } from '@libsql/client'
import path from 'path'

declare global {
  var _sqliteClient: Client | undefined
}

const dbPath = path.join(process.cwd(), 'nexus.db')
const dbUrl = process.env.DATABASE_URL || `file:${dbPath.replace(/\\/g, '/')}`

export const db: Client =
  global._sqliteClient ||
  createClient({
    url: dbUrl,
  })

if (process.env.NODE_ENV !== 'production') {
  global._sqliteClient = db
}

let initialized = false

export async function initDatabase() {
  if (initialized) return
  initialized = true

  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'Medium',
        status TEXT NOT NULL DEFAULT 'Open',
        service TEXT NOT NULL DEFAULT 'Core-Platform',
        env TEXT NOT NULL DEFAULT 'Production',
        assignee_name TEXT NOT NULL DEFAULT 'Unassigned',
        assignee_initials TEXT NOT NULL DEFAULT 'UN',
        assignee_status TEXT NOT NULL DEFAULT 'online',
        reporter_name TEXT NOT NULL DEFAULT 'Operations Team',
        reporter_email TEXT NOT NULL DEFAULT 'ops@nexus.internal',
        reporter_org TEXT NOT NULL DEFAULT 'Internal Operations',
        sla_seconds_total INTEGER NOT NULL DEFAULT 3600,
        sla_seconds_remaining INTEGER NOT NULL DEFAULT 3600,
        ai_triaged INTEGER NOT NULL DEFAULT 0,
        assigned_to_me INTEGER NOT NULL DEFAULT 0,
        tag TEXT NOT NULL DEFAULT 'General',
        created_time TEXT NOT NULL,
        ai_copilot_json TEXT,
        timeline_json TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS team_members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        tier TEXT NOT NULL DEFAULT 'Tier 2 (Core)',
        status TEXT NOT NULL DEFAULT 'online',
        initials TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS runbooks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'General',
        summary TEXT NOT NULL,
        tags_json TEXT,
        reads TEXT DEFAULT '0',
        last_updated TEXT NOT NULL,
        author_name TEXT NOT NULL,
        author_initials TEXT NOT NULL,
        author_role TEXT NOT NULL,
        steps_json TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS automation_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        trigger_event TEXT NOT NULL,
        condition_expr TEXT NOT NULL,
        action_expr TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        execution_count_today INTEGER NOT NULL DEFAULT 0,
        last_triggered TEXT NOT NULL DEFAULT 'Never',
        category TEXT NOT NULL DEFAULT 'Triage'
      );`,
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        event TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Infrastructure',
        actor_name TEXT NOT NULL,
        actor_email TEXT NOT NULL,
        actor_is_daemon INTEGER NOT NULL DEFAULT 0,
        source_ip TEXT NOT NULL DEFAULT '127.0.0.1',
        node TEXT NOT NULL DEFAULT 'primary-node',
        status TEXT NOT NULL DEFAULT 'Success',
        timestamp TEXT NOT NULL,
        sha256 TEXT NOT NULL,
        metadata_json TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'DevOps Engineer',
        created_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS sections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL DEFAULT 'cyan',
        created_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS email_settings (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL DEFAULT 'gmail',
        smtp_host TEXT NOT NULL DEFAULT 'smtp.gmail.com',
        smtp_port INTEGER NOT NULL DEFAULT 587,
        smtp_user TEXT,
        smtp_pass TEXT,
        sender_name TEXT NOT NULL DEFAULT 'Nexus Soporte TI',
        sender_email TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL
      );`
    ],
    'write'
  )

  // Seed default sections if empty
  const secRes = await db.execute('SELECT COUNT(*) as count FROM sections')
  if (Number(secRes.rows[0]?.count || 0) === 0) {
    const defaultSections = [
      { id: 'sec-soporte', name: 'Soporte TI', description: 'Atención a usuarios, hardware y software de oficina', color: 'blue' },
      { id: 'sec-infra', name: 'Infraestructura', description: 'Servidores, cloud, almacenamiento y bases de datos', color: 'emerald' },
      { id: 'sec-redes', name: 'Redes y Telecomunicaciones', description: 'Conectividad, switches, VPN y cortafuegos', color: 'purple' },
      { id: 'sec-seguridad', name: 'Seguridad Informática', description: 'Accesos, prevención de amenazas y auditorías', color: 'rose' },
      { id: 'sec-facturacion', name: 'Facturación y Finanzas', description: 'Sistemas contables, cobros y pagos', color: 'amber' },
    ]
    for (const sec of defaultSections) {
      await db.execute({
        sql: 'INSERT INTO sections (id, name, description, color, created_at) VALUES (?, ?, ?, ?, ?)',
        args: [sec.id, sec.name, sec.description, sec.color, new Date().toISOString()]
      })
    }
  }

  // Seed initial email setting row if empty
  const emailRes = await db.execute('SELECT COUNT(*) as count FROM email_settings')
  if (Number(emailRes.rows[0]?.count || 0) === 0) {
    await db.execute({
      sql: `INSERT INTO email_settings (id, provider, smtp_host, smtp_port, smtp_user, smtp_pass, sender_name, sender_email, is_active, updated_at)
            VALUES ('default', 'gmail', 'smtp.gmail.com', 587, 'soporte@nexus.io', '', 'Nexus Soporte TI', 'soporte@nexus.io', 1, ?)`,
      args: [new Date().toISOString()]
    })
  }
}

