'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon, Inbox, Sparkles, RefreshCw } from 'lucide-react'

export interface EmptyStateAction {
  label: string
  onClick?: () => void
  icon?: LucideIcon
  variant?: 'primary' | 'secondary' | 'outline'
}

export interface EmptyStateProps {
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
  title?: string
  description?: string
  badgeText?: string
  badgeTone?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose'
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  className?: string
  compact?: boolean
}

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No Records Detected',
  description = 'No matching telemetry records or incidents found in the active workspace buffer.',
  badgeText,
  badgeTone = 'cyan',
  action,
  secondaryAction,
  className = '',
  compact = false,
}: EmptyStateProps) {
  // Determine tone colors
  const toneMap = {
    cyan: {
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-600 dark:text-cyan-400',
      glow: 'shadow-[0_0_25px_rgba(6,182,212,0.2)]',
      pulse: 'bg-cyan-400/20',
      badge: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
    },
    violet: {
      border: 'border-violet-500/30',
      bg: 'bg-violet-500/10',
      text: 'text-violet-600 dark:text-violet-400',
      glow: 'shadow-[0_0_25px_rgba(139,92,246,0.2)]',
      pulse: 'bg-violet-400/20',
      badge: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    },
    emerald: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      glow: 'shadow-[0_0_25px_rgba(16,185,129,0.2)]',
      pulse: 'bg-emerald-400/20',
      badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    },
    amber: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400',
      glow: 'shadow-[0_0_25px_rgba(245,158,11,0.2)]',
      pulse: 'bg-amber-400/20',
      badge: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    },
    rose: {
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/10',
      text: 'text-rose-600 dark:text-rose-400',
      glow: 'shadow-[0_0_25px_rgba(244,63,94,0.2)]',
      pulse: 'bg-rose-400/20',
      badge: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
    },
  }

  const currentTone = toneMap[badgeTone]

  return (
    <div
      className={`nexus-glass-card rounded-2xl flex flex-col items-center justify-center text-center select-none ${
        compact ? 'p-6 sm:p-8' : 'p-8 sm:p-12 md:p-16'
      } ${className}`}
    >
      {/* Floating & Pulsing Animated Icon Container */}
      <div className="relative mb-5 flex items-center justify-center">
        {/* Soft Radial Pulse Background Halo */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.35, 0.65, 0.35],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`absolute size-20 rounded-full blur-xl ${currentTone.pulse}`}
        />

        {/* Floating Icon Orb */}
        <motion.div
          animate={{
            y: [0, -7, 0],
            rotate: [0, 1.5, -1.5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`relative flex size-16 items-center justify-center rounded-2xl border ${currentTone.border} ${currentTone.bg} ${currentTone.text} ${currentTone.glow} backdrop-blur-md`}
        >
          <Icon className="size-8 stroke-[1.75]" />

          {/* Micro orbital indicator */}
          <span className="absolute -top-1 -right-1 flex size-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
            <span className="relative inline-flex size-3 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]" />
          </span>
        </motion.div>
      </div>

      {/* Technical Status Badge (Optional) */}
      {badgeText && (
        <div className="mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] tracking-wider uppercase font-semibold border ${currentTone.badge}`}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {badgeText}
          </span>
        </div>
      )}

      {/* Heading */}
      <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
        {title}
      </h3>

      {/* Subtext */}
      <p className="mt-2 max-w-sm sm:max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>

      {/* Action Buttons */}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className={
                action.variant === 'outline'
                  ? 'flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary hover:border-cyan-500/40 transition-all shadow-sm'
                  : 'quantum-gradient-btn flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md'
              }
            >
              {action.icon && React.createElement(action.icon, { className: 'size-3.5' })}
              <span>{action.label}</span>
            </button>
          )}

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="flex items-center gap-2 rounded-xl border border-border bg-secondary/60 hover:bg-secondary px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
            >
              {secondaryAction.icon && React.createElement(secondaryAction.icon, { className: 'size-3.5' })}
              <span>{secondaryAction.label}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
