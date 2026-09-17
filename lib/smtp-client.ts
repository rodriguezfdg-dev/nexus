import net from 'node:net'
import tls from 'node:tls'

export interface SmtpOptions {
  host: string
  port: number
  user: string
  pass: string
  from: string
  fromName?: string
  to: string
  subject: string
  html?: string
  text?: string
}

export interface SmtpResult {
  success: boolean
  message: string
  details?: Record<string, any>
}

/**
 * Native Node.js SMTP client supporting STARTTLS (port 587) and SSL (port 465).
 * Requires zero external dependencies.
 */
export async function sendSmtpEmail(options: SmtpOptions): Promise<SmtpResult> {
  const { host, port, user, from, to, subject, html, text } = options
  const pass = options.pass.replace(/\s+/g, '') // remove spaces from Google app password
  const fromName = options.fromName || 'Nexus Soporte TI'

  return new Promise((resolve) => {
    let socket: net.Socket | tls.TLSSocket
    let isTls = port === 465
    let buffer = ''
    let step:
      | 'WAIT_GREETING'
      | 'SENT_EHLO_1'
      | 'SENT_STARTTLS'
      | 'SENT_EHLO_2'
      | 'SENT_AUTH_LOGIN'
      | 'SENT_USER'
      | 'SENT_PASS'
      | 'SENT_MAIL_FROM'
      | 'SENT_RCPT_TO'
      | 'SENT_DATA_CMD'
      | 'SENT_DATA_BODY'
      | 'SENT_QUIT' = 'WAIT_GREETING'

    const timeout = setTimeout(() => {
      cleanup()
      resolve({
        success: false,
        message: `Tiempo de espera agotado al conectar con ${host}:${port}. Verifica el servidor o cortafuegos.`,
      })
    }, 15000)

    const cleanup = () => {
      clearTimeout(timeout)
      try {
        socket?.removeAllListeners()
        socket?.destroy()
      } catch {}
    }

    const sendLine = (line: string) => {
      socket.write(line + '\r\n')
    }

    const setupListeners = (sock: net.Socket | tls.TLSSocket) => {
      sock.on('data', (chunk) => {
        buffer += chunk.toString('utf-8')

        const lines = buffer.split('\r\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          const codeMatch = line.match(/^(\d{3})(?:[ -]|$)/)
          if (!codeMatch) continue
          if (line.charAt(3) === '-') continue // multiline continuation (e.g. 250-...)

          const statusCode = parseInt(codeMatch[1], 10)
          handleResponse(statusCode, line)
        }
      })

      sock.on('error', (err) => {
        cleanup()
        resolve({
          success: false,
          message: `Error de conexión SMTP (${host}:${port}): ${err.message}`,
        })
      })
    }

    const handleResponse = (code: number, fullLine: string) => {
      try {
        switch (step) {
          case 'WAIT_GREETING':
            if (code === 220) {
              step = isTls ? 'SENT_EHLO_2' : 'SENT_EHLO_1'
              sendLine('EHLO localhost')
            } else {
              cleanup()
              resolve({
                success: false,
                message: `El servidor rechazó el saludo inicial: ${fullLine}`,
              })
            }
            break

          case 'SENT_EHLO_1':
            if (code === 250) {
              step = 'SENT_STARTTLS'
              sendLine('STARTTLS')
            } else {
              cleanup()
              resolve({
                success: false,
                message: `Fallo en EHLO inicial: ${fullLine}`,
              })
            }
            break

          case 'SENT_STARTTLS':
            if (code === 220) {
              // Upgrade socket to TLS
              socket.removeAllListeners()
              buffer = ''
              const secureSocket = tls.connect(
                {
                  socket,
                  host,
                  rejectUnauthorized: false,
                },
                () => {
                  step = 'SENT_EHLO_2'
                  sendLine('EHLO localhost')
                }
              )
              socket = secureSocket
              isTls = true
              setupListeners(secureSocket)
            } else {
              cleanup()
              resolve({
                success: false,
                message: `El servidor no admitió STARTTLS: ${fullLine}`,
              })
            }
            break

          case 'SENT_EHLO_2':
            if (code === 250) {
              step = 'SENT_AUTH_LOGIN'
              sendLine('AUTH LOGIN')
            } else {
              cleanup()
              resolve({
                success: false,
                message: `Fallo tras negociación TLS: ${fullLine}`,
              })
            }
            break

          case 'SENT_AUTH_LOGIN':
            if (code === 334) {
              step = 'SENT_USER'
              sendLine(Buffer.from(user).toString('base64'))
            } else {
              cleanup()
              resolve({
                success: false,
                message: `El servidor no aceptó autenticación LOGIN: ${fullLine}`,
              })
            }
            break

          case 'SENT_USER':
            if (code === 334) {
              step = 'SENT_PASS'
              sendLine(Buffer.from(pass).toString('base64'))
            } else {
              cleanup()
              resolve({
                success: false,
                message: `Error de usuario SMTP: ${fullLine}`,
              })
            }
            break

          case 'SENT_PASS':
            if (code === 235) {
              // Authentication successful!
              step = 'SENT_MAIL_FROM'
              sendLine(`MAIL FROM:<${from}>`)
            } else {
              cleanup()
              let hint = fullLine
              if (code === 535) {
                hint = 'Credenciales rechazadas. Asegúrate de usar una Contraseña de Aplicación de 16 letras de Google y tener activado 2FA.'
              }
              resolve({
                success: false,
                message: `Error de autenticación SMTP (Código ${code}): ${hint}`,
              })
            }
            break

          case 'SENT_MAIL_FROM':
            if (code === 250) {
              step = 'SENT_RCPT_TO'
              sendLine(`RCPT TO:<${to}>`)
            } else {
              cleanup()
              resolve({
                success: false,
                message: `El servidor rechazó el remitente (${from}): ${fullLine}`,
              })
            }
            break

          case 'SENT_RCPT_TO':
            if (code === 250) {
              step = 'SENT_DATA_CMD'
              sendLine('DATA')
            } else {
              cleanup()
              resolve({
                success: false,
                message: `El servidor rechazó el destinatario (${to}): ${fullLine}`,
              })
            }
            break

          case 'SENT_DATA_CMD':
            if (code === 354) {
              step = 'SENT_DATA_BODY'
              const messageId = `<nexus-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@${host}>`
              const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`
              
              const rawDate = new Date().toUTCString()
              const emailData = [
                `From: =?UTF-8?B?${Buffer.from(fromName).toString('base64')}?= <${from}>`,
                `To: <${to}>`,
                `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
                `Date: ${rawDate}`,
                `Message-ID: ${messageId}`,
                `MIME-Version: 1.0`,
                `Content-Type: multipart/alternative; boundary="${boundary}"`,
                '',
                `--${boundary}`,
                'Content-Type: text/plain; charset=UTF-8',
                'Content-Transfer-Encoding: 8bit',
                '',
                text || (html ? html.replace(/<[^>]+>/g, '') : 'Mensaje de Nexus TI'),
                '',
                `--${boundary}`,
                'Content-Type: text/html; charset=UTF-8',
                'Content-Transfer-Encoding: 8bit',
                '',
                html || `<p>${text || 'Mensaje de Nexus TI'}</p>`,
                '',
                `--${boundary}--`,
                '',
                '.', // End of DATA
              ].join('\r\n')

              sendLine(emailData)
            } else {
              cleanup()
              resolve({
                success: false,
                message: `El servidor rechazó el comando DATA: ${fullLine}`,
              })
            }
            break

          case 'SENT_DATA_BODY':
            if (code === 250) {
              step = 'SENT_QUIT'
              sendLine('QUIT')
              cleanup()
              resolve({
                success: true,
                message: `Correo enviado exitosamente a ${to}`,
                details: {
                  server: host,
                  port,
                  recipient: to,
                  timestamp: new Date().toLocaleTimeString(),
                  response: fullLine,
                },
              })
            } else {
              cleanup()
              resolve({
                success: false,
                message: `Fallo al enviar contenido del correo: ${fullLine}`,
              })
            }
            break

          case 'SENT_QUIT':
            cleanup()
            break
        }
      } catch (err: any) {
        cleanup()
        resolve({
          success: false,
          message: `Excepción en protocolo SMTP: ${err.message}`,
        })
      }
    }

    // Start initial socket connection
    if (isTls) {
      socket = tls.connect({ host, port, rejectUnauthorized: false })
    } else {
      socket = net.createConnection({ host, port })
    }

    setupListeners(socket)
  })
}
