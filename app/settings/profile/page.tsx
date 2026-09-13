'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Shield,
  Key,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Save,
  Globe,
} from 'lucide-react'
import { useToast } from '@/components/nexus/toast-provider'
import { useLanguage } from '@/lib/i18n/context'

export default function SettingsProfilePage() {
  const { locale, setLocale, t } = useLanguage()
  const [name, setName] = useState('Alex Thorne')
  const [email, setEmail] = useState('alex.thorne@nexus.internal')
  const [role, setRole] = useState('DevOps Commander / Tier-3 Lead')
  const [timezone, setTimezone] = useState('America/New_York (UTC-05:00)')
  const [apiKey, setApiKey] = useState('nx_live_9f82a1b4e7c2d49081e6')
  const [copiedKey, setCopiedKey] = useState(false)

  const { success, info } = useToast()

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
    success('API Key Copied', 'Personal telemetry key copied to clipboard.')
  }

  const handleRegenerateKey = () => {
    const newKey = `nx_live_${Math.random().toString(36).substr(2, 10)}${Math.random().toString(36).substr(2, 10)}`
    setApiKey(newKey)
    info('API Key Regenerated', 'Old key has been invalidated. Remember to update your CLI credentials.')
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    success(
      locale === 'es' ? 'Perfil Guardado' : 'Profile Saved',
      locale === 'es'
        ? 'Preferencias de identidad e idioma actualizadas con éxito.'
        : 'User identity and language preferences updated successfully.'
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Profile Overview Card */}
      <div className="nexus-glass-card rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-border">
          {/* Avatar with Status Dot */}
          <div className="relative size-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-violet-500/30 flex items-center justify-center font-mono text-xl font-bold text-foreground shrink-0 shadow-lg">
            AT
            <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-background shadow-[0_0_8px_#10b981]" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{name}</h2>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold uppercase">
                {t.nav.user_role}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{email}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{role}</p>
          </div>
        </div>

        {/* Edit Profile Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-foreground mb-1">
                {locale === 'es' ? 'Nombre Completo' : 'Full Display Name'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/60 px-3 py-2 text-foreground outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">
                {locale === 'es' ? 'Correo Electrónico' : 'Corporate Email Address'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/60 px-3 py-2 text-foreground outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <Globe className="size-3.5 text-cyan-500" />
                <span>{t.settings_page.language_select}</span>
              </label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as any)}
                className="w-full rounded-xl border border-border bg-secondary/60 px-2.5 py-2 text-foreground outline-none focus:border-cyan-500 transition font-medium"
              >
                <option value="es">Español (ES)</option>
                <option value="en">English (EN)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">
                {locale === 'es' ? 'Zona Horaria' : 'Operational Timezone'}
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/60 px-2.5 py-2 text-foreground outline-none focus:border-cyan-500 transition"
              >
                <option value="America/New_York (UTC-05:00)">America/New_York (UTC-05:00)</option>
                <option value="America/Los_Angeles (UTC-08:00)">America/Los_Angeles (UTC-08:00)</option>
                <option value="Europe/Madrid (UTC+01:00)">Europe/Madrid (UTC+01:00)</option>
                <option value="Europe/London (UTC+00:00)">Europe/London (UTC+00:00)</option>
                <option value="Asia/Tokyo (UTC+09:00)">Asia/Tokyo (UTC+09:00)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">
                {locale === 'es' ? 'Rol de Escalación' : 'Designated Escalation Role'}
              </label>
              <input
                type="text"
                disabled
                value="Tier-3 Principal Incident Commander"
                className="w-full rounded-xl border border-border bg-muted/60 px-3 py-2 text-muted-foreground font-mono outline-none truncate"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="quantum-gradient-btn flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold shadow-md"
            >
              <Save className="size-3.5" />
              <span>{t.settings_page.save_changes}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Personal API Access Token Card */}
      <div className="nexus-glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Key className="size-4 text-cyan-500" />
            <h3 className="text-sm font-bold text-foreground">
              Personal Telemetry API Token
            </h3>
          </div>
          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
            Active · Scope: Read/Write
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Use this cryptographic token to authenticate CLI utilities, CI/CD runbook triggers, and remote telemetry exporters.
        </p>

        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl border border-border bg-secondary/50 px-3 py-2 font-mono text-xs text-foreground truncate">
            {apiKey}
          </div>

          <button
            onClick={handleCopyKey}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-secondary px-3 py-2 text-xs font-semibold text-foreground transition"
            title="Copy API Key"
          >
            {copiedKey ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            <span>{copiedKey ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleRegenerateKey}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-secondary px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            title="Regenerate Key"
          >
            <RotateCcw className="size-3.5" />
            <span>Roll</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
