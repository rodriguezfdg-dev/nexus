'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  ChevronDown,
  Filter,
  Check,
  Command,
  Sparkles,
  Server,
  Users,
  AlertTriangle,
  Tag,
  X
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

interface FilterOption {
  id: string
  label: string
  icon: typeof Server
  options: string[]
}

const filterGroups: FilterOption[] = [
  {
    id: 'env',
    label: 'Entorno',
    icon: Server,
    options: ['Todos los Entornos', 'Producción', 'Staging / Pruebas', 'Edge'],
  },
  {
    id: 'assignee',
    label: 'Asignado',
    icon: Users,
    options: ['Todos los Niveles', 'Nivel 3 SecOps', 'Agente IA', 'DevOps Core', 'Sin Asignar'],
  },
  {
    id: 'priority',
    label: 'Prioridad',
    icon: AlertTriangle,
    options: ['Todas las Prioridades', 'P1 - Crítico (SLA 15m)', 'P2 - Alto', 'P3 - Normal', 'P4 - Bajo'],
  },
  {
    id: 'tags',
    label: 'Etiquetas',
    icon: Tag,
    options: ['Todas las Etiquetas', 'Base de Datos', 'Redes', 'Seguridad', 'Kubernetes'],
  },
]

export function NexusTopBar({
  onCreateTicket,
}: {
  onCreateTicket?: () => void
}) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { t } = useLanguage()

  const [mounted, setMounted] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({
    env: 'Todos los Entornos',
    assignee: 'Todos los Niveles',
    priority: 'Todas las Prioridades',
    tags: 'Todas las Etiquetas',
  })
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(3)

  useEffect(() => {
    setMounted(true)

    // Keyboard shortcut for ⌘K / Ctrl+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setActiveDropdown(null)
        setNotificationsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const currentTheme = mounted ? (resolvedTheme || theme || 'dark') : 'dark'

  const toggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark')
  }

  const selectFilterOption = (filterId: string, value: string) => {
    setSelectedFilters((prev) => ({ ...prev, [filterId]: value }))
    setActiveDropdown(null)
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-card/85 dark:bg-[#070b14]/85 px-4 lg:px-6 backdrop-blur-xl transition-colors">
        
        {/* Left: ⌘K Search Trigger Bar */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            onClick={() => setSearchOpen(true)}
            className="group flex h-9 w-full items-center justify-between rounded-lg border border-border/80 bg-secondary/50 dark:bg-slate-900/50 px-3 text-xs text-muted-foreground transition hover:border-cyan-500/40 hover:bg-secondary hover:text-foreground"
            title="Press ⌘K or Ctrl+K to search"
          >
            <div className="flex items-center gap-2">
              <Search className="size-3.5 text-muted-foreground group-hover:text-cyan-500 transition-colors" />
              <span className="truncate">{t.topbar.search_placeholder}</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              <Command className="size-2.5" />K
            </kbd>
          </button>
        </div>

        {/* Center: Filter Dropdown Buttons */}
        <div className="hidden xl:flex items-center gap-2 mx-4">
          {filterGroups.map((group) => {
            const Icon = group.icon
            const isOpen = activeDropdown === group.id
            const currentValue = selectedFilters[group.id]
            const isFiltered = !currentValue.startsWith('All')

            return (
              <div key={group.id} className="relative">
                <button
                  onClick={() => setActiveDropdown(isOpen ? null : group.id)}
                  className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition ${
                    isFiltered
                      ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="size-3.5 text-muted-foreground" />
                  <span className="max-w-[110px] truncate">{currentValue}</span>
                  <ChevronDown className="size-3 opacity-60" />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setActiveDropdown(null)}
                    />
                    <div className="absolute left-0 mt-1.5 z-40 w-52 rounded-xl border border-border bg-popover p-1.5 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95">
                      <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        {group.label}
                      </div>
                      {group.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => selectFilterOption(group.id, opt)}
                          className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs transition ${
                            currentValue === opt
                              ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-semibold'
                              : 'text-foreground hover:bg-muted'
                          }`}
                        >
                          <span className="truncate">{opt}</span>
                          {currentValue === opt && <Check className="size-3.5 text-cyan-500" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Right Actions: Notifications, Theme Toggle & Quantum Ticket Button */}
        <div className="flex items-center gap-3">
          
          {/* Notification Bell with Animated Badge Count */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="relative flex size-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition shadow-sm"
              title="Notifications"
              aria-label="Notifications"
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
                    <span className="text-xs font-semibold text-foreground">Operational Alerts</span>
                    <button
                      onClick={() => setNotificationCount(0)}
                      className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    <div className="flex gap-2.5 rounded-lg p-2 bg-amber-500/10 border border-amber-500/20 text-xs">
                      <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-foreground">SLA Breach Warning</div>
                        <div className="text-[11px] text-muted-foreground">Cluster Node #04 approaching 95% latency tolerance.</div>
                        <div className="font-mono text-[9px] text-amber-600 dark:text-amber-400 mt-1">2m ago</div>
                      </div>
                    </div>
                    <div className="flex gap-2.5 rounded-lg p-2 bg-cyan-500/10 border border-cyan-500/20 text-xs">
                      <Sparkles className="size-4 text-cyan-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-foreground">AI Triage Completed</div>
                        <div className="text-[11px] text-muted-foreground">Automated ticket #INC-8924 categorized and rerouted.</div>
                        <div className="font-mono text-[9px] text-cyan-600 dark:text-cyan-400 mt-1">14m ago</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle Switch (next-themes with class strategy) */}
          <button
            onClick={toggleTheme}
            className="relative flex h-9 items-center gap-2 rounded-lg border border-border bg-card hover:bg-secondary px-2.5 text-xs font-medium text-foreground transition shadow-sm select-none"
            title={`Toggle Theme (Current: ${currentTheme})`}
            aria-label="Toggle light and dark theme"
          >
            <div className="relative flex size-5 items-center justify-center">
              {currentTheme === 'dark' ? (
                <Sun className="size-4 text-cyan-400 transition-all drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
              ) : (
                <Moon className="size-4 text-violet-600 transition-all" />
              )}
            </div>
            <span className="hidden md:inline font-mono text-[11px] capitalize">
              {currentTheme === 'dark' ? t.topbar.theme_dark : t.topbar.theme_light}
            </span>
          </button>

          {/* "Create Quantum Ticket" Button with Gradient Glow */}
          <button
            onClick={onCreateTicket}
            className="quantum-gradient-btn flex h-9 items-center gap-2 rounded-lg px-3.5 text-xs font-bold transition select-none"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span className="hidden sm:inline">{t.topbar.create_ticket}</span>
            <span className="sm:hidden">{t.topbar.create_ticket_short}</span>
          </button>

        </div>
      </header>

      {/* ⌘K Command Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-popover/95 p-4 shadow-2xl backdrop-blur-2xl z-10"
            >
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <Search className="size-5 text-cyan-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.topbar.search_modal_placeholder}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-medium"
                  autoFocus
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="py-4 space-y-2">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground px-2">
                  {t.topbar.quick_commands}
                </div>
                {[
                  { title: 'Triage P1 Incident #INC-9428', badge: 'Active P1', tone: 'rose' },
                  { title: 'Run Kubernetes Node Health Check', badge: 'Automated', tone: 'cyan' },
                  { title: 'Generate SLA Compliance Export PDF', badge: 'Report', tone: 'violet' },
                  { title: 'Rotate Database IAM Security Keys', badge: 'SecOps', tone: 'amber' },
                ].map((item) => (
                  <button
                    key={item.title}
                    onClick={() => setSearchOpen(false)}
                    className="flex w-full items-center justify-between rounded-lg p-2 text-xs text-foreground hover:bg-cyan-500/10 transition group"
                  >
                    <span className="font-medium group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                      {item.title}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-border bg-secondary text-muted-foreground">
                      {item.badge}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-2.5 text-[10px] text-muted-foreground font-mono">
                <span>Use ↑ ↓ to navigate, ESC to exit</span>
                <span className="text-cyan-500">Nexus Search Engine v2.4</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
