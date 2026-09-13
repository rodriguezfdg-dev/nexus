'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  Mail,
  X,
  MoreVertical,
  Sparkles,
} from 'lucide-react'
import { useToast } from '@/components/nexus/toast-provider'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  tier: 'Tier 3 (Lead)' | 'Tier 2 (Core)' | 'Tier 1 (Triage)'
  status: 'online' | 'busy' | 'offline'
  initials: string
}

export default function SettingsTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: 'usr-01',
      name: 'Alex Thorne',
      email: 'alex.thorne@nexus.internal',
      role: 'Principal DevOps Architect',
      tier: 'Tier 3 (Lead)',
      status: 'busy',
      initials: 'AT',
    },
    {
      id: 'usr-02',
      name: 'Elena Rostova',
      email: 'elena.rostova@nexus.internal',
      role: 'Staff SecOps & SRE Engineer',
      tier: 'Tier 3 (Lead)',
      status: 'online',
      initials: 'ER',
    },
    {
      id: 'usr-03',
      name: 'Sarah Lin',
      email: 'sarah.lin@nexus.internal',
      role: 'Database Reliability Engineer',
      tier: 'Tier 2 (Core)',
      status: 'online',
      initials: 'SL',
    },
    {
      id: 'usr-04',
      name: 'Marcus Vance',
      email: 'marcus.vance@nexus.internal',
      role: 'Network Infrastructure SRE',
      tier: 'Tier 2 (Core)',
      status: 'offline',
      initials: 'MV',
    },
  ])

  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteTier, setInviteTier] = useState<'Tier 3 (Lead)' | 'Tier 2 (Core)' | 'Tier 1 (Triage)'>('Tier 2 (Core)')

  const { success } = useToast()

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    const newMember: TeamMember = {
      id: `usr-${Date.now().toString().slice(-3)}`,
      name: inviteEmail.split('@')[0].replace('.', ' ').toUpperCase(),
      email: inviteEmail,
      role: 'DevOps Engineer',
      tier: inviteTier,
      status: 'offline',
      initials: inviteEmail.slice(0, 2).toUpperCase(),
    }

    setMembers((prev) => [...prev, newMember])
    setInviteModalOpen(false)
    setInviteEmail('')
    success('Invitation Dispatched', `Cryptographic onboard invite sent to ${inviteEmail}.`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="nexus-glass-card rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="size-4 text-cyan-500" />
              <span>Incident Response Team & On-Call Roster</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Manage escalation engineers, on-call paging hierarchies, and tier privileges.
            </p>
          </div>

          <button
            onClick={() => setInviteModalOpen(true)}
            className="quantum-gradient-btn flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-md shrink-0"
          >
            <UserPlus className="size-3.5" />
            <span>Invite Engineer</span>
          </button>
        </div>

        {/* Team Members List */}
        <div className="divide-y divide-border/60">
          {members.map((member) => (
            <div
              key={member.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs group"
            >
              <div className="flex items-center gap-3">
                <div className="relative size-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-border flex items-center justify-center font-mono font-bold text-foreground shrink-0">
                  {member.initials}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-card ${
                      member.status === 'online'
                        ? 'bg-emerald-500'
                        : member.status === 'busy'
                        ? 'bg-amber-500'
                        : 'bg-muted-foreground'
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    <span>{member.name}</span>
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded border border-border bg-secondary text-muted-foreground">
                      {member.tier}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-[11px] truncate">
                    {member.role} · {member.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={member.tier}
                  onChange={(e) => {
                    const newTier = e.target.value as any
                    setMembers((prev) =>
                      prev.map((m) => (m.id === member.id ? { ...m, tier: newTier } : m))
                    )
                    success('Tier Updated', `Updated ${member.name} to ${newTier}.`)
                  }}
                  className="rounded-lg border border-border bg-secondary/60 px-2.5 py-1 text-[11px] text-foreground outline-none font-medium"
                >
                  <option value="Tier 3 (Lead)">Tier 3 (Lead)</option>
                  <option value="Tier 2 (Core)">Tier 2 (Core)</option>
                  <option value="Tier 1 (Triage)">Tier 1 (Triage)</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Member Modal */}
      <AnimatePresence>
        {inviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInviteModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-cyan-500/30 bg-popover/95 p-6 shadow-2xl backdrop-blur-2xl z-10 text-xs"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-foreground">Invite SRE / DevOps Engineer</h3>
                <button onClick={() => setInviteModalOpen(false)}>
                  <X className="size-4 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleSendInvite} className="mt-4 space-y-4">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="engineer@nexus.internal"
                    className="w-full rounded-xl border border-border bg-secondary/60 px-3 py-2 text-foreground outline-none focus:border-cyan-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Escalation Tier Assignment
                  </label>
                  <select
                    value={inviteTier}
                    onChange={(e) => setInviteTier(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-secondary/60 px-2.5 py-2 text-foreground outline-none focus:border-cyan-500"
                  >
                    <option value="Tier 3 (Lead)">Tier 3 (Lead) — P1 Root Cause & Failover Authority</option>
                    <option value="Tier 2 (Core)">Tier 2 (Core) — Service Diagnostics & Runbooks</option>
                    <option value="Tier 1 (Triage)">Tier 1 (Triage) — Initial Queue & Routing</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="rounded-xl border border-border px-3.5 py-2 font-semibold text-muted-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="quantum-gradient-btn rounded-xl px-4 py-2 font-bold"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
