'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Settings,
  User,
  Bell,
  Shield,
  Users,
  Sliders,
  Sparkles,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { t } = useLanguage()

  const settingsNavItems = [
    { href: '/settings/profile', label: t.settings_page.nav_profile, icon: User, id: 'profile' },
    { href: '/settings/notifications', label: t.settings_page.nav_notifications, icon: Bell, id: 'notifications' },
    { href: '/settings/security', label: t.settings_page.nav_security, icon: Shield, id: 'security' },
    { href: '/settings/team', label: t.settings_page.nav_team, icon: Users, id: 'team' },
  ]

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full pb-12">
      {/* Settings Page Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1.5">
              <Settings className="size-3 text-cyan-500" />
              {t.settings_page.badge}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {t.settings_page.sub}
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t.settings_page.title}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t.settings_page.description}
          </p>
        </div>
      </div>

      {/* Settings Sub-Navigation & Content Grid */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sub-Navigation Side Tabs */}
        <aside className="w-full lg:w-64 shrink-0 nexus-glass-card rounded-2xl p-2 sm:p-3 space-y-1 select-none">
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold">
            Settings Navigation
          </div>

          {settingsNavItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href === '/settings/profile' && pathname === '/settings')

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 shadow-sm font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent'
                }`}
              >
                {/* Active Indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="settingsNavActive"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"
                  />
                )}

                <Icon
                  className={`size-4 transition-colors ${
                    isActive ? 'text-cyan-500' : 'text-muted-foreground'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </aside>

        {/* Sub-Route Page Content with Smooth Transition */}
        <main className="flex-1 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
