'use client'

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  X,
  Info,
} from 'lucide-react'

export type ToastType = 'success' | 'warning' | 'critical' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: ToastItem[]
  showToast: (toast: Omit<ToastItem, 'id'>) => string
  dismissToast: (id: string) => void
  success: (title: string, description?: string, duration?: number) => string
  warning: (title: string, description?: string, duration?: number) => string
  critical: (title: string, description?: string, duration?: number) => string
  info: (title: string, description?: string, duration?: number) => string
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      const newToast: ToastItem = { ...toast, id, duration: toast.duration ?? 4500 }

      setToasts((prev) => [...prev, newToast])
      return id
    },
    []
  )

  const success = useCallback(
    (title: string, description?: string, duration?: number) =>
      showToast({ type: 'success', title, description, duration }),
    [showToast]
  )

  const warning = useCallback(
    (title: string, description?: string, duration?: number) =>
      showToast({ type: 'warning', title, description, duration }),
    [showToast]
  )

  const critical = useCallback(
    (title: string, description?: string, duration?: number) =>
      showToast({ type: 'critical', title, description, duration }),
    [showToast]
  )

  const info = useCallback(
    (title: string, description?: string, duration?: number) =>
      showToast({ type: 'info', title, description, duration }),
    [showToast]
  )

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        success,
        warning,
        critical,
        info,
      }}
    >
      {children}

      {/* Slide-in Toast Container in the bottom-right corner */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence mode="sync">
          {toasts.map((t) => (
            <SingleToast key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

function SingleToast({
  toast,
  onDismiss,
}: {
  toast: ToastItem
  onDismiss: () => void
}) {
  const duration = toast.duration ?? 4500
  const [isPaused, setIsPaused] = useState(false)

  // Configure variant styling matching NexusDesk theme
  const config = {
    success: {
      border: 'border-emerald-500/40',
      bg: 'bg-popover/95 dark:bg-[#071110]/95',
      glow: 'shadow-[0_4px_25px_rgba(16,185,129,0.25)]',
      progressBg: 'bg-emerald-500',
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
      badgeText: 'SUCCESS',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
    },
    warning: {
      border: 'border-amber-500/40',
      bg: 'bg-popover/95 dark:bg-[#140e04]/95',
      glow: 'shadow-[0_4px_25px_rgba(245,158,11,0.22)]',
      progressBg: 'bg-amber-500',
      badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400',
      badgeText: 'WARNING',
      icon: AlertTriangle,
      iconColor: 'text-amber-500 dark:text-amber-400',
    },
    critical: {
      border: 'border-rose-500/40',
      bg: 'bg-popover/95 dark:bg-[#15060a]/95',
      glow: 'shadow-[0_4px_25px_rgba(244,63,94,0.28)]',
      progressBg: 'bg-rose-500',
      badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400',
      badgeText: 'CRITICAL',
      icon: AlertOctagon,
      iconColor: 'text-rose-500 dark:text-rose-400',
    },
    info: {
      border: 'border-cyan-500/40',
      bg: 'bg-popover/95 dark:bg-[#040d16]/95',
      glow: 'shadow-[0_4px_25px_rgba(6,182,212,0.25)]',
      progressBg: 'bg-cyan-500',
      badgeBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-600 dark:text-cyan-400',
      badgeText: 'INFO',
      icon: Sparkles,
      iconColor: 'text-cyan-500 dark:text-cyan-400',
    },
  }[toast.type]

  const IconComponent = config.icon

  // Auto-dismiss countdown
  React.useEffect(() => {
    if (isPaused) return
    const timer = setTimeout(() => {
      onDismiss()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onDismiss, isPaused])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.92, transition: { duration: 0.18 } }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${config.border} ${config.bg} ${config.glow} backdrop-blur-2xl p-4 select-none shadow-xl`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon with Subtle Neon Aura */}
        <div className="mt-0.5 shrink-0 flex items-center justify-center">
          <IconComponent className={`size-5 ${config.iconColor} drop-shadow-[0_0_8px_currentColor]`} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-foreground tracking-tight">
              {toast.title}
            </h4>
            <span
              className={`font-mono text-[9px] px-1.5 py-0.2 rounded border font-semibold ${config.badgeBg}`}
            >
              {config.badgeText}
            </span>
          </div>

          {toast.description && (
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              {toast.description}
            </p>
          )}

          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick()
                onDismiss()
              }}
              className="mt-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition"
          aria-label="Dismiss notification"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Auto-dismiss progress countdown bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary/50 overflow-hidden">
        <motion.div
          className={`h-full ${config.progressBg}`}
          initial={{ width: '100%' }}
          animate={{ width: isPaused ? undefined : '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      </div>
    </motion.div>
  )
}
