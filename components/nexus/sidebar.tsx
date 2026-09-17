'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutGrid,
  PlusCircle,
  BarChart3,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
  User,
  Sparkles,
  LogOut
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

import { useNexusData } from '@/lib/data-context'

export interface NavItem {
  id: string
  label: string
  href: string
  icon: any
  badge?: string
  badgeTone?: 'cyan' | 'amber' | 'emerald' | 'violet'
}

const navItems: NavItem[] = [
  { id: 'kanban', label: 'Tablero', href: '/kanban', icon: LayoutGrid },
  { id: 'new-ticket', label: 'Crear Ticket', href: '/tickets/new', icon: PlusCircle },
  { id: 'reports', label: 'Reportería & Métricas', href: '/reports', icon: BarChart3 },
  { id: 'audit', label: 'Auditoría & Trazabilidad', href: '/audit-logs', icon: Shield },
  { id: 'admin', label: 'Panel de Control', href: '/admin', icon: Sliders },
]

export function NexusSidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const { incidents } = useNexusData()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string } | null>(null)

  const activeIncidentCount = incidents.filter((i) => i.status !== 'Resolved').length

  const roleLower = (currentUser?.role || '').toLowerCase()
  const isTI =
    roleLower === 'ti' ||
    roleLower.includes('ti') ||
    roleLower.includes('admin') ||
    roleLower.includes('lead') ||
    roleLower.includes('soporte')

  // Role-based navigation: Standard 'usuario' only sees Tablero and Crear Ticket
  const visibleNavItems = navItems.filter((item) => {
    if (isTI) return true
    return item.id === 'kanban' || item.id === 'new-ticket'
  })

  const getLabel = (id: string, defaultLabel: string) => {
    switch (id) {
      case 'kanban': return 'Tablero'
      case 'new-ticket': return 'Crear Ticket'
      case 'reports': return 'Reportería'
      case 'audit': return 'Auditoría'
      case 'admin': return 'Panel de Control'
      default: return defaultLabel
    }
  }



  // Persist collapsed state and read current logged-in user
  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('nexus_sidebar_collapsed')
      if (saved !== null) {
        setCollapsed(saved === 'true')
      }
      const userStr = localStorage.getItem('nexus_user')
      if (userStr) {
        setCurrentUser(JSON.parse(userStr))
      }
    } catch (e) {}
  }, [])


  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem('nexus_sidebar_collapsed', String(next))
    } catch (e) {}
  }

  return (
    <aside
      className={`relative flex flex-col border-r transition-all duration-300 select-none z-30 shrink-0
        ${collapsed ? 'w-[72px]' : 'w-64'}
        border-border bg-card/80 dark:bg-[#070b14]/90 backdrop-blur-xl
      `}
    >
      {/* Sidebar Header & Brand Logo */}
      <div className="flex h-16 items-center justify-between px-3.5 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Logo with pulsating glow dot */}
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Shield className="size-5" />
            <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#22d3ee]" />
            </span>
          </div>

          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <div className="font-mono text-sm font-bold tracking-wider text-foreground">
                NEXUS<span className="text-cyan-600 dark:text-cyan-400 font-black">DESK</span>
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                {t.nav.brand_sub}
              </div>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button */}
        <button
          onClick={toggleCollapse}
          className="flex size-7 items-center justify-center rounded-lg border border-border bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1.5 scrollbar-thin">
        {visibleNavItems.map((item) => {
          const Icon = item.icon
          const label = getLabel(item.id, item.label)
          const isActive =
            pathname === item.href ||
            (pathname === '/' && item.href === '/dashboard') ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-200
                ${
                  isActive
                    ? 'bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 dark:border-cyan-500/40 active-nav-glow font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70 border border-transparent'
                }
              `}
              title={collapsed ? label : undefined}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <motion.span
                  layoutId="activeNavIndicator"
                  className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_10px_#06b6d4]"
                />
              )}

              <Icon
                className={`size-4 shrink-0 transition-colors ${
                  isActive
                    ? 'text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                    : 'group-hover:text-foreground'
                }`}
              />

              {!collapsed && (
                <span className="truncate flex-1 text-left">{label}</span>
              )}

              {/* Badge if present */}
              {!collapsed && (item.id === 'incidents' ? activeIncidentCount > 0 : item.badge) && (
                <span
                  className={`ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded-md border ${
                    item.id === 'incidents'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                      : item.badgeTone === 'amber'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                      : item.badgeTone === 'emerald'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                      : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                  }`}
                >
                  {item.id === 'incidents' ? activeIncidentCount : item.badge}
                </span>
              )}

              {collapsed && item.badge && (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-cyan-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section: Health Indicator & User Profile */}
      <div className="p-2 border-t border-border bg-card/40 dark:bg-black/20">
        {/* User Profile Badge with Role & Logout */}

        <div
          className={`flex items-center gap-2.5 rounded-lg border border-border/80 bg-card p-2 text-xs transition ${
            collapsed ? 'justify-center px-2' : 'px-2.5'
          }`}
        >
          <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-violet-500/30 text-foreground font-semibold font-mono text-xs">
            {currentUser?.name
              ? currentUser.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
              : 'NX'}
            <span className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
          </div>

          {!collapsed && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <div className="flex flex-col min-w-0">
                <div className="truncate font-medium text-xs text-foreground">
                  {currentUser?.name || 'Usuario'}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                    isTI
                      ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                      : 'bg-secondary text-muted-foreground border border-border'
                  }`}>
                    {isTI ? 'TI • Total' : 'Usuario'}
                  </span>
                </div>
              </div>

              <button
                onClick={async () => {
                  try {
                    await fetch('/api/auth', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'logout' }),
                    })
                  } catch (e) {}
                  try {
                    localStorage.removeItem('nexus_user')
                  } catch (e) {}
                  window.location.href = '/login'
                }}
                className="p-1.5 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                title="Cerrar sesión / Salir"
                aria-label="Cerrar sesión"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>
    </aside>
  )
}
