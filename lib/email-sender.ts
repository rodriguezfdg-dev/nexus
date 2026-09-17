import { db, initDatabase } from '@/lib/db'
import { sendSmtpEmail } from '@/lib/smtp-client'

async function getSmtpConfig() {
  await initDatabase()
  const result = await db.execute("SELECT * FROM email_settings WHERE id = 'default' LIMIT 1")

  if (result.rows.length === 0) {
    console.warn('Configuración de correo no encontrada.')
    return null
  }

  const config: any = result.rows[0]
  if (!config.is_active || !config.smtp_user || !config.smtp_pass) {
    console.warn('Servicio de correo inactivo o sin credenciales configuradas.')
    return null
  }

  return config
}

export function getStatusSpanish(status: string): { label: string; color: string; bg: string } {
  switch (status) {
    case 'Open':
      return { label: 'Pendiente', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' }
    case 'In Progress':
      return { label: 'En Proceso', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' }
    case 'Blocked':
      return { label: 'En Revisión', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' }
    case 'Resolved':
      return { label: 'Resuelto', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' }
    case 'Closed':
      return { label: 'Cerrado', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' }
    default:
      return { label: status, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' }
  }
}

export function getPrioritySpanish(priority: string): { label: string; color: string; bg: string } {
  switch (priority) {
    case 'Critical':
      return { label: 'Crítica (P1)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
    case 'High':
      return { label: 'Alta (P2)', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' }
    case 'Medium':
      return { label: 'Media (P3)', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' }
    case 'Low':
      return { label: 'Baja (P4)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' }
    default:
      return { label: priority, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' }
  }
}

export async function getAssigneeEmail(assigneeName: string): Promise<string | null> {
  if (!assigneeName || assigneeName === 'Sin Asignar' || assigneeName === 'Unassigned') {
    return null
  }
  if (assigneeName.includes('@')) {
    return assigneeName
  }

  try {
    await initDatabase()
    // 1. Search in users table
    const userRes = await db.execute({
      sql: 'SELECT email FROM users WHERE name = ? LIMIT 1',
      args: [assigneeName],
    })
    if (userRes.rows.length > 0 && userRes.rows[0].email) {
      return String(userRes.rows[0].email)
    }

    // 2. Search in team_members table
    const teamRes = await db.execute({
      sql: 'SELECT email FROM team_members WHERE name = ? LIMIT 1',
      args: [assigneeName],
    })
    if (teamRes.rows.length > 0 && teamRes.rows[0].email) {
      return String(teamRes.rows[0].email)
    }
  } catch (err) {
    console.error('Error al buscar email del asignado:', assigneeName, err)
  }

  return null
}

export async function sendVerificationCodeEmail(
  toEmail: string,
  name: string,
  code: string,
  purpose: 'registration' | 'password_reset' = 'registration'
): Promise<{ success: boolean; message: string }> {
  try {
    const config = await getSmtpConfig()
    if (!config) {
      return { success: false, message: 'Servicio de correo inactivo o sin credenciales' }
    }

    const isReset = purpose === 'password_reset'
    const subject = isReset
      ? `Código de recuperación de contraseña: ${code} - Desarrollo TI - Lander Inmobiliaria`
      : `Código de verificación de registro: ${code} - Desarrollo TI - Lander Inmobiliaria`

    const actionDescription = isReset
      ? 'Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.'
      : 'Se ha registrado tu cuenta en la plataforma de Desarrollo TI - Lander Inmobiliaria.'

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 540px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    
    <!-- Header -->
    <div style="padding: 24px 32px; background: linear-gradient(135deg, rgba(6,182,212,0.15), rgba(124,58,237,0.15)); border-bottom: 1px solid #1f2937;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
        Desarrollo TI <span style="color: #22d3ee;">- Lander Inmobiliaria</span>
      </h1>
      <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #9ca3af;">
        Operaciones TI & Mesa de Ayuda
      </p>
    </div>

    <!-- Body Content -->
    <div style="padding: 32px; color: #e5e7eb;">
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #f3f4f6;">
        Hola <strong style="color: #38bdf8;">${name || 'Usuario'}</strong>,
      </p>
      <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; color: #9ca3af;">
        ${actionDescription} Tu código de verificación de 6 dígitos es:
      </p>

      <!-- Code Box -->
      <div style="background: #030712; border: 1px solid #0891b2; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #22d3ee;">
          ${code}
        </div>
        <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #6b7280; margin-top: 8px;">
          Código de Verificación Seguro
        </div>
      </div>

      <p style="margin: 0 0 16px 0; font-size: 12px; line-height: 1.5; color: #9ca3af;">
        ${
          isReset
            ? 'Ingresa este código en la pantalla de recuperación de contraseña para establecer una nueva clave.'
            : 'Conserva este código. Podrás usarlo en caso de necesitar restablecer tu acceso o validar tu identidad con el equipo de Desarrollo TI.'
        }
      </p>

      ${
        !isReset
          ? `
      <div style="background: rgba(245,158,11,0.1); border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-top: 20px;">
        <p style="margin: 0; font-size: 11px; color: #fbbf24; line-height: 1.4;">
          <strong>Estado de tu cuenta:</strong> Tu acceso permanece en estado <em>Inactivo</em> hasta que un Administrador de TI active tu cuenta manualmente y te asigne tu rol de permisos.
        </p>
      </div>
      `
          : ''
      }
    </div>

    <!-- Footer -->
    <div style="padding: 16px 32px; background: #030712; border-top: 1px solid #1f2937; text-align: center;">
      <p style="margin: 0; font-size: 10px; color: #6b7280;">
        Este es un mensaje automático generado por Desarrollo TI - Lander Inmobiliaria. Si no solicitaste este código, puedes ignorar este correo.
      </p>
    </div>

  </div>
</body>
</html>
`

    const text = `DESARROLLO TI - LANDER INMOBILIARIA\nCÓDIGO DE VERIFICACIÓN\n\nHola ${name},\n${actionDescription}\n\nTu código de verificación es: ${code}\n\n${
      isReset
        ? 'Ingresa este código para restablecer tu contraseña.'
        : 'Guarda este código para validación o recuperación futura. Tu cuenta queda en espera de activación por un Administrador de TI.'
    }`

    const res = await sendSmtpEmail({
      host: config.smtp_host,
      port: Number(config.smtp_port),
      user: config.smtp_user,
      pass: config.smtp_pass,
      from: config.sender_email || config.smtp_user,
      fromName: config.sender_name || 'Desarrollo TI - Lander Inmobiliaria',
      to: toEmail,
      subject,
      html,
      text,
    })

    return res
  } catch (error: any) {
    console.error('Error enviando correo de verificación:', error)
    return { success: false, message: error.message }
  }
}

/**
 * Notifica al técnico o responsable cuando se le asigna un ticket nuevo o reasignado.
 */
export async function sendTicketAssignedEmail({
  toEmail,
  assigneeName,
  ticketId,
  title,
  priority,
  service,
  reporterName,
  reporterEmail,
}: {
  toEmail: string
  assigneeName: string
  ticketId: string
  title: string
  priority: string
  service: string
  reporterName: string
  reporterEmail?: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const config = await getSmtpConfig()
    if (!config) {
      return { success: false, message: 'Servicio de correo inactivo o sin credenciales' }
    }

    const prio = getPrioritySpanish(priority)
    const subject = `[Desarrollo TI - Lander Inmobiliaria] Nuevo ticket asignado: ${ticketId} - ${title}`

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 580px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    
    <!-- Header -->
    <div style="padding: 24px 32px; background: linear-gradient(135deg, rgba(6,182,212,0.15), rgba(124,58,237,0.15)); border-bottom: 1px solid #1f2937;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
        Desarrollo TI <span style="color: #22d3ee;">- Lander Inmobiliaria</span>
      </h1>
      <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #9ca3af;">
        Asignación de Tickets de Soporte
      </p>
    </div>

    <!-- Body Content -->
    <div style="padding: 32px; color: #e5e7eb;">
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #f3f4f6;">
        Hola <strong style="color: #38bdf8;">${assigneeName}</strong>,
      </p>
      <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #9ca3af;">
        Se te ha asignado como responsable técnico del siguiente requerimiento en la plataforma:
      </p>

      <!-- Ticket Card Box -->
      <div style="background: #030712; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #1f2937; padding-bottom: 12px;">
          <div>
            <span style="display: inline-block; background: rgba(6,182,212,0.15); border: 1px solid rgba(6,182,212,0.3); color: #22d3ee; font-family: monospace; font-size: 13px; font-weight: 700; padding: 4px 10px; border-radius: 6px;">
              ${ticketId}
            </span>
          </div>
          <div>
            <span style="display: inline-block; background: ${prio.bg}; color: ${prio.color}; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">
              Prioridad ${prio.label}
            </span>
          </div>
        </div>

        <h2 style="margin: 0 0 14px 0; font-size: 16px; font-weight: 700; color: #ffffff; line-height: 1.4;">
          ${title}
        </h2>

        <div style="font-size: 12px; line-height: 1.8; color: #9ca3af;">
          <div><strong>Área / Servicio:</strong> <span style="color: #e5e7eb;">${service || 'Soporte General'}</span></div>
          <div><strong>Solicitante:</strong> <span style="color: #e5e7eb;">${reporterName}</span> ${reporterEmail ? `<span style="color: #6b7280;">(${reporterEmail})</span>` : ''}</div>
        </div>
      </div>

      <div style="background: rgba(6,182,212,0.08); border-left: 3px solid #06b6d4; padding: 14px 16px; border-radius: 6px; margin-top: 20px;">
        <p style="margin: 0; font-size: 12px; color: #67e8f9; line-height: 1.5;">
          <strong>Acción requerida:</strong> Ingresa a la plataforma de Desarrollo TI para atender y diagnosticar este ticket.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 16px 32px; background: #030712; border-top: 1px solid #1f2937; text-align: center;">
      <p style="margin: 0; font-size: 10px; color: #6b7280;">
        Notificación automática enviada por Desarrollo TI - Lander Inmobiliaria.
      </p>
    </div>

  </div>
</body>
</html>
`

    const text = `DESARROLLO TI - LANDER INMOBILIARIA\nNUEVO TICKET ASIGNADO\n\nHola ${assigneeName},\nSe te ha asignado como responsable del ticket ${ticketId}.\n\nTítulo: ${title}\nPrioridad: ${prio.label}\nÁrea / Servicio: ${service}\nSolicitante: ${reporterName} (${reporterEmail || 'N/A'})\n\nPor favor ingresa a la plataforma para gestionar la atención del ticket.`

    return await sendSmtpEmail({
      host: config.smtp_host,
      port: Number(config.smtp_port),
      user: config.smtp_user,
      pass: config.smtp_pass,
      from: config.sender_email || config.smtp_user,
      fromName: config.sender_name || 'Desarrollo TI - Lander Inmobiliaria',
      to: toEmail,
      subject,
      html,
      text,
    })
  } catch (error: any) {
    console.error('Error enviando correo de asignación de ticket:', error)
    return { success: false, message: error.message }
  }
}

/**
 * Notifica al creador / solicitante del ticket cuando éste ha sido atendido (cambio de estado).
 */
export async function sendTicketStatusChangedEmail({
  toEmail,
  reporterName,
  ticketId,
  title,
  previousStatus,
  newStatus,
  assigneeName,
  service,
  priority,
}: {
  toEmail: string
  reporterName: string
  ticketId: string
  title: string
  previousStatus: string
  newStatus: string
  assigneeName?: string
  service?: string
  priority?: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const config = await getSmtpConfig()
    if (!config) {
      return { success: false, message: 'Servicio de correo inactivo o sin credenciales' }
    }

    const prevSt = getStatusSpanish(previousStatus)
    const newSt = getStatusSpanish(newStatus)
    const prio = priority ? getPrioritySpanish(priority) : null
    const subject = `[Desarrollo TI - Lander Inmobiliaria] Tu ticket ${ticketId} ha sido actualizado: ${newSt.label}`

    let statusDescription = 'Tu requerimiento está siendo atendido activamente por nuestro equipo técnico de Desarrollo TI.'
    if (newStatus === 'In Progress') {
      statusDescription = 'Un especialista técnico ha comenzado a trabajar en la resolución de tu requerimiento.'
    } else if (newStatus === 'Blocked') {
      statusDescription = 'Tu ticket se encuentra actualmente en revisión técnica especializada o en espera de validación.'
    } else if (newStatus === 'Resolved' || newStatus === 'Closed') {
      statusDescription = '¡Tu requerimiento ha sido resuelto! Por favor verifica el correcto funcionamiento del servicio.'
    }

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 580px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    
    <!-- Header -->
    <div style="padding: 24px 32px; background: linear-gradient(135deg, rgba(6,182,212,0.15), rgba(124,58,237,0.15)); border-bottom: 1px solid #1f2937;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
        Desarrollo TI <span style="color: #22d3ee;">- Lander Inmobiliaria</span>
      </h1>
      <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #9ca3af;">
        Mesa de Ayuda & Actualización de Estado
      </p>
    </div>

    <!-- Body Content -->
    <div style="padding: 32px; color: #e5e7eb;">
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #f3f4f6;">
        Hola <strong style="color: #38bdf8;">${reporterName || 'Usuario'}</strong>,
      </p>
      <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #9ca3af;">
        Te informamos que tu ticket ha sido atendido y ha cambiado de estado:
      </p>

      <!-- Status Transition Box -->
      <div style="background: #030712; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
        <div style="display: inline-flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap;">
          <span style="display: inline-block; background: ${prevSt.bg}; color: ${prevSt.color}; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 9999px; text-decoration: line-through;">
            ${prevSt.label}
          </span>
          <span style="color: #9ca3af; font-size: 16px; font-weight: bold;">➔</span>
          <span style="display: inline-block; background: ${newSt.bg}; color: ${newSt.color}; font-size: 13px; font-weight: 800; padding: 6px 16px; border-radius: 9999px; border: 1px solid ${newSt.color};">
            ${newSt.label}
          </span>
        </div>
      </div>

      <!-- Ticket Card Box -->
      <div style="background: #030712; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #1f2937; padding-bottom: 12px;">
          <span style="display: inline-block; background: rgba(6,182,212,0.15); border: 1px solid rgba(6,182,212,0.3); color: #22d3ee; font-family: monospace; font-size: 13px; font-weight: 700; padding: 4px 10px; border-radius: 6px;">
            ${ticketId}
          </span>
          ${
            prio
              ? `<span style="display: inline-block; background: ${prio.bg}; color: ${prio.color}; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">Prioridad ${prio.label}</span>`
              : ''
          }
        </div>

        <h2 style="margin: 0 0 14px 0; font-size: 16px; font-weight: 700; color: #ffffff; line-height: 1.4;">
          ${title}
        </h2>

        <div style="font-size: 12px; line-height: 1.8; color: #9ca3af;">
          <div><strong>Atendido por:</strong> <span style="color: #38bdf8; font-weight: 600;">${assigneeName && assigneeName !== 'Sin Asignar' && assigneeName !== 'Unassigned' ? assigneeName : 'Equipo de Desarrollo TI'}</span></div>
          ${service ? `<div><strong>Área / Servicio:</strong> <span style="color: #e5e7eb;">${service}</span></div>` : ''}
        </div>
      </div>

      <div style="background: rgba(16,185,129,0.08); border-left: 3px solid #10b981; padding: 14px 16px; border-radius: 6px; margin-top: 20px;">
        <p style="margin: 0; font-size: 12px; color: #6ee7b7; line-height: 1.5;">
          ${statusDescription}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 16px 32px; background: #030712; border-top: 1px solid #1f2937; text-align: center;">
      <p style="margin: 0; font-size: 10px; color: #6b7280;">
        Mensaje automático generado por Desarrollo TI - Lander Inmobiliaria. Puedes revisar el avance en tiempo real desde la plataforma.
      </p>
    </div>

  </div>
</body>
</html>
`

    const text = `DESARROLLO TI - LANDER INMOBILIARIA\nACTUALIZACIÓN DE TICKET\n\nHola ${reporterName || 'Usuario'},\nTu ticket ${ticketId} ha cambiado de estado: ${prevSt.label} ➔ ${newSt.label}.\n\nTítulo: ${title}\nAtendido por: ${assigneeName || 'Equipo TI'}\n\n${statusDescription}`

    return await sendSmtpEmail({
      host: config.smtp_host,
      port: Number(config.smtp_port),
      user: config.smtp_user,
      pass: config.smtp_pass,
      from: config.sender_email || config.smtp_user,
      fromName: config.sender_name || 'Desarrollo TI - Lander Inmobiliaria',
      to: toEmail,
      subject,
      html,
      text,
    })
  } catch (error: any) {
    console.error('Error enviando correo de cambio de estado:', error)
    return { success: false, message: error.message }
  }
}

/**
 * Controlador de notificaciones para cuando se actualiza un ticket (cambio de estado o asignación).
 */
export async function handleIncidentUpdatedNotifications({
  prevIncident,
  newStatus,
  newAssigneeName,
  updatedTitle,
  updatedPriority,
  updatedService,
}: {
  prevIncident: any
  newStatus?: string
  newAssigneeName?: string
  updatedTitle?: string
  updatedPriority?: string
  updatedService?: string
}) {
  try {
    const ticketId = prevIncident.id
    const title = updatedTitle || prevIncident.title
    const service = updatedService || prevIncident.service
    const priority = updatedPriority || prevIncident.priority
    const reporterEmail = prevIncident.reporter_email
    const reporterName = prevIncident.reporter_name || 'Usuario'

    // 1. Notificar al creador cuando el ticket ha sido atendido (cambio de estado)
    if (newStatus && newStatus !== prevIncident.status) {
      if (reporterEmail && reporterEmail.includes('@') && !reporterEmail.endsWith('.internal')) {
        await sendTicketStatusChangedEmail({
          toEmail: reporterEmail,
          reporterName,
          ticketId,
          title,
          previousStatus: prevIncident.status,
          newStatus,
          assigneeName: newAssigneeName || prevIncident.assignee_name,
          service,
          priority,
        })
      }
    }

    // 2. Notificar al nuevo responsable cuando es asignado (si antes no estaba asignado o cambió de técnico)
    const prevAssignee = prevIncident.assignee_name
    const isNewAssigneeValid =
      newAssigneeName &&
      newAssigneeName !== 'Sin Asignar' &&
      newAssigneeName !== 'Unassigned'

    if (isNewAssigneeValid && newAssigneeName !== prevAssignee) {
      const email = await getAssigneeEmail(newAssigneeName)
      if (email && email.includes('@') && !email.endsWith('.internal')) {
        await sendTicketAssignedEmail({
          toEmail: email,
          assigneeName: newAssigneeName,
          ticketId,
          title,
          priority,
          service,
          reporterName,
          reporterEmail,
        })
      }
    }
  } catch (err) {
    console.error('Error in handleIncidentUpdatedNotifications:', err)
  }
}
