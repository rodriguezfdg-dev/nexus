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
        timeline_json TEXT,
        attachments_json TEXT
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
        role TEXT NOT NULL DEFAULT 'usuario',
        status TEXT NOT NULL DEFAULT 'inactivo',
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
      );`,
      `CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_type TEXT NOT NULL,
        file_url TEXT NOT NULL,
        uploaded_by TEXT NOT NULL DEFAULT 'Operador',
        created_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        department TEXT DEFAULT 'General',
        color TEXT NOT NULL DEFAULT 'cyan',
        created_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS ticket_audit_events (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        action TEXT NOT NULL,
        previous_status TEXT,
        new_status TEXT,
        previous_assignee TEXT,
        new_assignee TEXT,
        actor_name TEXT NOT NULL,
        actor_email TEXT,
        details TEXT NOT NULL,
        created_at TEXT NOT NULL,
        duration_seconds INTEGER DEFAULT 0,
        metadata_json TEXT
      );`
    ],
    'write'
  )

  // Safe migration for existing incidents table
  try {
    await db.execute('ALTER TABLE incidents ADD COLUMN attachments_json TEXT')
  } catch {
    // Column already exists
  }

  // Safe migration for users table (status and verification code columns)
  try {
    await db.execute("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'activo'")
  } catch {
    // Column already exists
  }
  try {
    await db.execute("ALTER TABLE users ADD COLUMN verification_code TEXT")
  } catch {}
  try {
    await db.execute("ALTER TABLE users ADD COLUMN verification_code_expires TEXT")
  } catch {}
  try {
    await db.execute("UPDATE users SET status = 'activo' WHERE status IS NULL OR status = ''")
  } catch {}

  // Safe migration to correct typos in sections and incidents
  try {
    await db.execute(
      "UPDATE sections SET name = 'Auditoría', description = '' WHERE LOWER(name) LIKE '%aditor%' OR LOWER(description) LIKE '%aditor%' OR LOWER(name) = 'auditoria' OR LOWER(description) = 'aditora'"
    )
  } catch {}
  try {
    await db.execute(
      "UPDATE incidents SET service = 'Auditoría' WHERE LOWER(service) LIKE '%aditor%' OR LOWER(service) = 'auditoria'"
    )
  } catch {}
  try {
    await db.execute(
      "UPDATE sections SET description = '' WHERE LOWER(TRIM(name)) = LOWER(TRIM(description))"
    )
  } catch {}

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

  // Seed default roles if empty
  const roleRes = await db.execute('SELECT COUNT(*) as count FROM roles')
  if (Number(roleRes.rows[0]?.count || 0) === 0) {
    const defaultRoles = [
      { id: 'role-soporte-1', name: 'Soporte TI (Nivel 1)', description: 'Atención a tickets de primer nivel, mesa de ayuda y diagnóstico preliminar', department: 'Soporte TI', color: 'blue' },
      { id: 'role-devops-lead', name: 'DevOps Lead', description: 'Gestión de pipelines CI/CD, infraestructura cloud y automatizaciones', department: 'Infraestructura', color: 'cyan' },
      { id: 'role-noc-op', name: 'Operador NOC', description: 'Monitoreo de telemetría 24/7, guardia de SLA y escalamiento de incidentes', department: 'Redes y Telecomunicaciones', color: 'purple' },
      { id: 'role-admin', name: 'Administrador del Sistema', description: 'Control total de usuarios, roles, configuraciones y auditoría global', department: 'Seguridad Informática', color: 'amber' },
      { id: 'role-sec-lead', name: 'Especialista en Seguridad TI', description: 'Gestión de accesos, análisis de vulnerabilidades y respuesta a incidentes', department: 'Seguridad Informática', color: 'rose' },
    ]
    for (const r of defaultRoles) {
      await db.execute({
        sql: 'INSERT INTO roles (id, name, description, department, color, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        args: [r.id, r.name, r.description, r.department, r.color, new Date().toISOString()]
      })
    }
  }
}

