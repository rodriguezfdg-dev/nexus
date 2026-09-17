/**
 * Script de migración masiva para Nexus (SQLite)
 * Uso:
 *   node scripts/migrate.js                       (Carga lib/seed-template.json)
 *   node scripts/migrate.js ./mis-datos.json       (Carga un archivo JSON personalizado)
 *   node scripts/migrate.js --clear               (Limpia todas las tablas SQLite)
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@libsql/client')

const dbPath = path.join(__dirname, '..', 'nexus.db')
const db = createClient({
  url: `file:${dbPath.replace(/\\/g, '/')}`
})

async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--clear')) {
    console.log('🧹 Limpiando todas las tablas en nexus.db...')
    await db.batch([
      'DELETE FROM incidents',
      'DELETE FROM team_members',
      'DELETE FROM runbooks',
      'DELETE FROM automation_rules',
      'DELETE FROM audit_logs'
    ], 'write')
    console.log('✅ Base de datos SQLite completamente limpia y vacía.')
    process.exit(0)
  }

  const filePath = args[0] || path.join(__dirname, '..', 'lib', 'seed-template.json')
  console.log(`📦 Leyendo datos desde: ${filePath}`)

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Archivo no encontrado: ${filePath}`)
    process.exit(1)
  }

  const raw = fs.readFileSync(filePath, 'utf-8')
  const data = JSON.parse(raw)

  // Asegurar tablas
  await db.batch([
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
    );`
  ], 'write')

  if (Array.isArray(data.incidents)) {
    for (const inc of data.incidents) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO incidents (
          id, title, priority, status, service, env,
          assignee_name, assignee_initials, assignee_status,
          reporter_name, reporter_email, reporter_org,
          sla_seconds_total, sla_seconds_remaining,
          ai_triaged, assigned_to_me, tag, created_time,
          ai_copilot_json, timeline_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          inc.id,
          inc.title,
          inc.priority || 'Medium',
          inc.status || 'Open',
          inc.service || 'Core-Service',
          inc.env || 'Production',
          inc.assignee?.name || 'Unassigned',
          inc.assignee?.initials || 'UN',
          inc.assignee?.status || 'online',
          inc.reporter?.name || 'Ops',
          inc.reporter?.email || 'ops@nexus.internal',
          inc.reporter?.organization || 'Enterprise',
          inc.slaSecondsTotal || 3600,
          inc.slaSecondsRemaining || 3600,
          inc.aiTriaged ? 1 : 0,
          inc.assignedToMe ? 1 : 0,
          inc.tag || 'General',
          inc.createdTime || 'Just now',
          JSON.stringify(inc.aiCopilot || null),
          JSON.stringify(inc.timeline || []),
        ],
      })
    }
    console.log(`  ✓ ${data.incidents.length} incidentes migrados.`)
  }

  if (Array.isArray(data.teamMembers)) {
    for (const mem of data.teamMembers) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO team_members (id, name, email, role, tier, status, initials)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          mem.id,
          mem.name,
          mem.email,
          mem.role,
          mem.tier || 'Tier 2 (Core)',
          mem.status || 'online',
          mem.initials || 'OP',
        ],
      })
    }
    console.log(`  ✓ ${data.teamMembers.length} miembros de equipo migrados.`)
  }

  if (Array.isArray(data.runbooks)) {
    for (const rb of data.runbooks) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO runbooks (
          id, title, category, summary, tags_json, reads, last_updated,
          author_name, author_initials, author_role, steps_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          rb.id,
          rb.title,
          rb.category,
          rb.summary,
          JSON.stringify(rb.tags || []),
          rb.reads || '0',
          rb.lastUpdated || 'Today',
          rb.author?.name || 'Ops',
          rb.author?.initials || 'OP',
          rb.author?.role || 'Lead',
          JSON.stringify(rb.steps || []),
        ],
      })
    }
    console.log(`  ✓ ${data.runbooks.length} runbooks migrados.`)
  }

  if (Array.isArray(data.automationRules)) {
    for (const rule of data.automationRules) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO automation_rules (
          id, name, description, trigger_event, condition_expr, action_expr,
          status, execution_count_today, last_triggered, category
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          rule.id,
          rule.name,
          rule.description,
          rule.trigger,
          rule.condition,
          rule.action,
          rule.status || 'active',
          rule.executionCountToday || 0,
          rule.lastTriggered || 'Never',
          rule.category || 'Triage',
        ],
      })
    }
    console.log(`  ✓ ${data.automationRules.length} reglas de automatización migradas.`)
  }

  console.log('🎉 Migración completada con éxito en nexus.db.')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Error en la migración:', err)
  process.exit(1)
})
