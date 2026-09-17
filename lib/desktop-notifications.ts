// Utilidad para Notificaciones de Escritorio (Windows / Sistema Operativo)

export type NotificationPermState = 'granted' | 'denied' | 'default' | 'unsupported'

/**
 * Retorna el estado actual del permiso de notificaciones en el navegador.
 */
export function getNotificationPermission(): NotificationPermState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission as NotificationPermState
}

/**
 * Solicita permiso al usuario para enviar notificaciones al sistema Windows.
 */
export async function requestNotificationPermission(): Promise<NotificationPermState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  try {
    const perm = await Notification.requestPermission()
    return perm as NotificationPermState
  } catch (err) {
    console.error('Error solicitando permiso de notificaciones:', err)
    return 'denied'
  }
}

/**
 * Reproduce un sonido de campana sutil utilizando Web Audio API (sin archivos externos).
 */
export function playNotificationSound() {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.12, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + duration)
    }

    const now = ctx.currentTime
    playTone(659.25, now, 0.2) // Nota E5
    playTone(880.00, now + 0.12, 0.35) // Nota A5
  } catch {}
}

/**
 * Emite una notificación emergente nativa al Centro de Notificaciones de Windows.
 */
export function showWindowsNotification({
  title,
  body,
  onClickUrl,
  tag,
}: {
  title: string
  body: string
  onClickUrl?: string
  tag?: string
}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return

  if (Notification.permission === 'granted') {
    playNotificationSound()

    try {
      const notif = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: tag || `nexus-ticket-${Date.now()}`,
      })

      if (onClickUrl) {
        notif.onclick = () => {
          window.focus()
          window.location.href = onClickUrl
          notif.close()
        }
      }
    } catch (err) {
      console.warn('Error al disparar notificación de Windows:', err)
    }
  }
}
