'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  Command,
  Sparkles,
  AlertTriangle,
  Tag,
  User,
  X,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { useNexusData } from '@/lib/data-context'

export function NexusTopBar({
  onCreateTicket,
}: {
  onCreateTicket?: () => void
}) {
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { t } = useLanguage()
  const { incidents } = useNexusData()

  const [mounted, setMounted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(3)

  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)

    // Keyboard shortcut for ⌘K / Ctrl+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchInputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setNotificationsOpen(false)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const currentTheme = mounted ? (resolvedTheme || theme || 'dark') : 'dark'

  const toggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark')
  }

  // Filter incidents by word or ticket number
  const filteredIncidents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      // Return recent 6 incidents when query is empty
      return incidents.slice(0, 6)
    }

    const cleanNum = q.replace(/^#/, '').replace(/^nx-/, '').trim()

    return incidents.filter((inc) => {
      const idClean = (inc.id || '').replace('#', '').toLowerCase()
      const titleLower = (inc.title || '').toLowerCase()
      const serviceLower = (inc.service || inc.tag || '').toLowerCase()
      const reporterLower = (inc.reporter?.name || '').toLowerCase()
      const assigneeLower = (inc.assignee?.name || '').toLowerCase()

      return (
        idClean.includes(q) ||
        (cleanNum.length > 0 && idClean.includes(cleanNum)) ||
        titleLower.includes(q) ||
        serviceLower.includes(q) ||
        reporterLower.includes(q) ||
        assigneeLower.includes(q)
      )
    })
  }, [incidents, searchQuery])

  const handleSelectIncident = (id: string) => {
    const rawId = id.replace('#', '')
    router.push(`/incidents/${rawId}`)
    setSearchOpen(false)
    setSearchQuery('')
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (filteredIncidents.length > 0) {
        handleSelectIncident(filteredIncidents[0].id)
      }
    } else if (e.key === 'Escape') {
      setSearchOpen(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">Pendiente</span>
      case 'In Progress':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">En Proceso</span>
      case 'Blocked':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">En Revisión</span>
      case 'Resolved':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">Cerrado</span>
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary text-muted-foreground border border-border">{status}</span>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">Crítica</span>
      case 'High':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">Alta</span>
      case 'Medium':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">Media</span>
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">Baja</span>
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-card/85 dark:bg-[#070b14]/85 px-4 lg:px-6 backdrop-blur-xl transition-colors">
      
      {/* Search Input Bar with Auto-complete Dropdown */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-xl">
        <div className="relative flex items-center w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={handleInputKeyDown}
            placeholder="Buscar por palabra o número de ticket... (⌘K)"
            className="h-9.5 w-full rounded-xl border border-border/80 bg-secondary/40 dark:bg-slate-900/50 pl-10 pr-16 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500 focus:bg-background focus:ring-1 focus:ring-cyan-500 transition font-medium shadow-xs"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  searchInputRef.current?.focus()
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground transition"
                title="Limpiar búsqueda"
              >
                <X className="size-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground select-none">
              <Command className="size-2.5" />K
            </kbd>
          </div>
        </div>

        {/* Live Search Results Popover */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-11 z-50 rounded-2xl border border-cyan-500/30 bg-popover/95 shadow-2xl backdrop-blur-2xl p-2.5 space-y-2 max-h-[420px] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-2 pt-1 pb-1.5 border-b border-border text-[11px] font-semibold text-muted-foreground">
                <span>
                  {searchQuery.trim()
                    ? `Resultados para "${searchQuery}" (${filteredIncidents.length})`
                    : 'Tickets recientes'}
                </span>
                <span className="font-mono text-[10px]">Presiona Enter para abrir</span>
              </div>

              {filteredIncidents.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <p>No se encontraron tickets con ese término o número.</p>
                  <p className="text-[11px] mt-1 text-muted-foreground/80">
                    Prueba buscando por número (ej: 2124), título o solicitante.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredIncidents.map((ticket) => (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => handleSelectIncident(ticket.id)}
                      className="w-full text-left flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-cyan-500/10 dark:hover:bg-cyan-950/30 border border-transparent hover:border-cyan-500/30 transition group cursor-pointer"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/25">
                            {ticket.id}
                          </span>
                          <span className="text-xs font-bold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition truncate">
                            {ticket.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-semibold border border-border text-[10px]">
                            {ticket.service || ticket.tag || 'General'}
                          </span>
                          {ticket.reporter?.name && (
                            <span className="flex items-center gap-1">
                              <User className="size-3 text-cyan-500" />
                              <span>{ticket.reporter.name}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-mono text-[10px]">
                            <Clock className="size-3" />
                            {ticket.createdTime}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {getPriorityBadge(ticket.priority)}
                        {getStatusBadge(ticket.status)}
                        <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all ml-1" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Actions: Notifications, Theme Toggle & Create Ticket Button */}
      <div className="flex items-center gap-3">
        
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className="relative flex size-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition shadow-sm cursor-pointer"
            title="Notificaciones"
            aria-label="Notificaciones"
          >
            <Bell className="size-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-[0_0_8px_#f43f5e]">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60" />
                <span className="relative font-mono">{notificationCount}</span>
              </span>
            )}
          </button>

          {/* Notifications Panel */}
          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-2 z-40 w-80 rounded-xl border border-border bg-popover p-3 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-semibold text-foreground">Alertas del Sistema</span>
                  <button
                    onClick={() => setNotificationCount(0)}
                    className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                  >
                    Limpiar todo
                  </button>
                </div>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                  <div className="flex gap-2.5 rounded-lg p-2 bg-amber-500/10 border border-amber-500/20 text-xs">
                    <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">Alerta de SLA</div>
                      <div className="text-[11px] text-muted-foreground">Ticket con tolerancia de respuesta próxima a vencer.</div>
                      <div className="font-mono text-[9px] text-amber-600 dark:text-amber-400 mt-1">Hace 2m</div>
                    </div>
                  </div>
                  <div className="flex gap-2.5 rounded-lg p-2 bg-cyan-500/10 border border-cyan-500/20 text-xs">
                    <Sparkles className="size-4 text-cyan-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">Diagnóstico IA Completado</div>
                      <div className="text-[11px] text-muted-foreground">Ticket analizado y categorizado automáticamente.</div>
                      <div className="font-mono text-[9px] text-cyan-600 dark:text-cyan-400 mt-1">Hace 14m</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle Switch */}
        <button
          onClick={toggleTheme}
          className="relative flex h-9 items-center gap-2 rounded-lg border border-border bg-card hover:bg-secondary px-2.5 text-xs font-medium text-foreground transition shadow-sm select-none cursor-pointer"
          title={`Cambiar Tema (Actual: ${currentTheme})`}
          aria-label="Alternar tema claro y oscuro"
        >
          <div className="relative flex size-5 items-center justify-center">
            {currentTheme === 'dark' ? (
              <Sun className="size-4 text-cyan-400 transition-all drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
            ) : (
              <Moon className="size-4 text-violet-600 transition-all" />
            )}
          </div>
          <span className="hidden md:inline font-mono text-[11px] capitalize">
            {currentTheme === 'dark' ? 'Oscuro' : 'Claro'}
          </span>
        </button>

        {/* "Crear Ticket" Button */}
        <button
          onClick={onCreateTicket}
          className="quantum-gradient-btn flex h-9 items-center gap-2 rounded-lg px-3.5 text-xs font-bold transition select-none cursor-pointer shadow-md"
        >
          <Plus className="size-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Crear Ticket</span>
          <span className="sm:hidden">Ticket</span>
        </button>

      </div>
    </header>
  )
}
