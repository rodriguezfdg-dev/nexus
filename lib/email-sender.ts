import { db, initDatabase } from '@/lib/db'
import { sendSmtpEmail } from '@/lib/smtp-client'

export async function sendVerificationCodeEmail(
  toEmail: string,
  name: string,
  code: string,
  purpose: 'registration' | 'password_reset' = 'registration'
): Promise<{ success: boolean; message: string }> {
  try {
    await initDatabase()
    const result = await db.execute("SELECT * FROM email_settings WHERE id = 'default' LIMIT 1")

    if (result.rows.length === 0) {
      console.warn('Configuración de correo no encontrada.')
      return { success: false, message: 'Configuración de correo no disponible' }
    }

    const config: any = result.rows[0]
    if (!config.is_active || !config.smtp_user || !config.smtp_pass) {
      console.warn('Servicio de correo inactivo o sin credenciales.')
      return { success: false, message: 'Servicio de correo no configurado' }
    }

    const isReset = purpose === 'password_reset'
    const subject = isReset
      ? `Código de recuperación de contraseña: ${code} - Nexus TI`
      : `Código de verificación de registro: ${code} - Nexus TI`

    const actionDescription = isReset
      ? 'Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.'
      : 'Se ha registrado tu cuenta en la consola de Operaciones y Mesa de Ayuda TI NexusDesk.'

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
      <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 1px;">
        NEXUS<span style="color: #22d3ee;">DESK</span>
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
            : 'Conserva este código. Podrás usarlo en caso de necesitar restablecer tu acceso o validar tu identidad con el equipo de TI.'
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
        Este es un mensaje automático generado por Nexus TI. Si no solicitaste este código, puedes ignorar este correo.
      </p>
    </div>

  </div>
</body>
</html>
`

    const text = `NEXUSDESK TI - CÓDIGO DE VERIFICACIÓN\n\nHola ${name},\n${actionDescription}\n\nTu código de verificación es: ${code}\n\n${
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
      fromName: config.sender_name || 'Nexus Soporte TI',
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
