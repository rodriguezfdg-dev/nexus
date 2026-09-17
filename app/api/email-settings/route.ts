import { NextResponse } from 'next/server'
import { db, initDatabase } from '@/lib/db'
import { sendSmtpEmail } from '@/lib/smtp-client'

export async function GET() {
  try {
    await initDatabase()
    await db.execute(`CREATE TABLE IF NOT EXISTS email_settings (
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
    );`)

    const result = await db.execute("SELECT * FROM email_settings WHERE id = 'default' LIMIT 1")
    if (result.rows.length === 0) {
      return NextResponse.json({
        provider: 'gmail',
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: '',
        sender_name: 'Nexus Soporte TI',
        sender_email: '',
        is_active: 1,
      })
    }

    const row: any = result.rows[0]
    return NextResponse.json({
      provider: row.provider,
      smtp_host: row.smtp_host,
      smtp_port: Number(row.smtp_port),
      smtp_user: row.smtp_user,
      sender_name: row.sender_name,
      sender_email: row.sender_email,
      is_active: Boolean(row.is_active),
      has_password: Boolean(row.smtp_pass && row.smtp_pass.length > 0),
    })
  } catch (error: any) {
    console.error('Error fetching email settings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await initDatabase()
    const body = await request.json()
    const { action, provider, smtp_host, smtp_port, smtp_user, smtp_pass, sender_name, sender_email, test_recipient } = body

    // Check existing stored password
    const existing = await db.execute("SELECT id, smtp_pass FROM email_settings WHERE id = 'default' LIMIT 1")
    const storedPass = (existing.rows[0]?.smtp_pass as string) || ''
    const effectivePass = (smtp_pass !== undefined && smtp_pass.trim() !== '') ? smtp_pass.trim() : storedPass

    if (action === 'test') {
      const targetRecipient = test_recipient || sender_email || smtp_user
      
      if (!smtp_user) {
        return NextResponse.json({
          success: false,
          error: 'Debes configurar la dirección de correo o usuario antes de probar la conexión.'
        }, { status: 400 })
      }

      if (!effectivePass) {
        return NextResponse.json({
          success: false,
          error: 'Debes ingresar o haber guardado la Contraseña de Aplicación de 16 caracteres de Google para probar el envío.'
        }, { status: 400 })
      }

      const host = smtp_host || (provider === 'gmail' ? 'smtp.gmail.com' : 'smtp.office365.com')
      const port = Number(smtp_port) || 587
      const fromAddr = sender_email || smtp_user
      const fromDisplay = sender_name || 'Desarrollo TI - Lander Inmobiliaria'

      const testHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #0284c7, #06b6d4); padding: 20px; border-radius: 12px; color: #ffffff; text-align: center;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">Desarrollo TI - Lander Inmobiliaria</h2>
            <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">Correo de Verificación SMTP</p>
          </div>
          <div style="padding: 24px 8px; color: #1e293b; line-height: 1.6;">
            <p style="font-size: 16px; font-weight: 600; color: #0f172a;">¡Hola!</p>
            <p>Este correo confirma que tu servidor SMTP de <strong>${provider === 'gmail' ? 'Google Gmail' : 'tu proveedor'}</strong> está correctamente enlazado con la plataforma de <strong>Desarrollo TI - Lander Inmobiliaria</strong>.</p>
            <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 14px 18px; margin: 20px 0; border-radius: 6px; font-size: 13px; color: #334155; font-family: monospace;">
              <strong>Detalles técnicos:</strong><br>
              • Servidor: ${host}:${port}<br>
              • Cuenta Autenticada: ${smtp_user}<br>
              • Remitente: ${fromDisplay} &lt;${fromAddr}&gt;<br>
              • Destinatario: ${targetRecipient}<br>
              • Fecha y Hora: ${new Date().toLocaleString()}
            </div>
            <p style="font-size: 13px; color: #64748b;">A partir de este momento, todos los tickets, alertas y comunicaciones de los usuarios podrán ser despachados en tiempo real mediante esta cuenta.</p>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
            Enviado de forma segura desde la plataforma de Desarrollo TI - Lander Inmobiliaria.
          </div>
        </div>
      `

      const smtpResult = await sendSmtpEmail({
        host,
        port,
        user: smtp_user,
        pass: effectivePass,
        from: fromAddr,
        fromName: fromDisplay,
        to: targetRecipient,
        subject: '✅ Desarrollo TI - Lander Inmobiliaria: Verificación de Conexión Exitosa',
        html: testHtml,
        text: `Desarrollo TI - Lander Inmobiliaria: Correo de verificación exitoso para ${targetRecipient} enviado desde ${host}:${port} a las ${new Date().toLocaleString()}`,
      })

      if (!smtpResult.success) {
        return NextResponse.json({
          success: false,
          error: smtpResult.message,
        }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: `¡Correo de verificación REAL enviado a ${targetRecipient}! Revisa tu bandeja de entrada.`,
        details: {
          host,
          port,
          security: port === 465 ? 'SSL' : 'STARTTLS',
          recipient: targetRecipient,
          timestamp: new Date().toLocaleTimeString(),
        }
      })
    }

    // Save settings
    const passwordToStore = smtp_pass !== undefined && smtp_pass.trim() !== '' ? smtp_pass.trim() : storedPass

    await db.execute({
      sql: `INSERT OR REPLACE INTO email_settings (id, provider, smtp_host, smtp_port, smtp_user, smtp_pass, sender_name, sender_email, is_active, updated_at)
            VALUES ('default', ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      args: [
        provider || 'gmail',
        smtp_host || (provider === 'gmail' ? 'smtp.gmail.com' : 'smtp.office365.com'),
        Number(smtp_port) || 587,
        smtp_user || '',
        passwordToStore,
        sender_name || 'Nexus Soporte TI',
        sender_email || smtp_user || '',
        new Date().toISOString(),
      ],
    })

    return NextResponse.json({
      success: true,
      message: 'Configuración de correo guardada con éxito.',
    })
  } catch (error: any) {
    console.error('Error in email settings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
