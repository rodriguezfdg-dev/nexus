'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Key,
  Lock,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Laptop,
  Save,
  RotateCcw,
} from 'lucide-react'
import { useToast } from '@/components/nexus/toast-provider'

export default function SettingsSecurityPage() {
  const [quantumTls, setQuantumTls] = useState(true)
  const [enforceMfa, setEnforceMfa] = useState(true)
  const [ipRestricted, setIpRestricted] = useState(false)

  const { success, warning, info } = useToast()

  const sessions = [
    {
      id: 'sess-01',
      device: 'Chrome 132 · Windows 11',
      location: 'New York, US (192.168.1.42)',
      isCurrent: true,
      lastActive: 'Active Now',
    },
    {
      id: 'sess-02',
      device: 'macOS Sonoma · IT Terminal',
      location: 'Ashburn, US (172.16.4.12)',
      isCurrent: false,
      lastActive: '2h ago',
    },
    {
      id: 'sess-03',
      device: 'NexusDesk Mobile App · iOS 18',
      location: 'New York, US (10.0.8.21)',
      isCurrent: false,
      lastActive: 'Yesterday',
    },
  ]

  const handleRevokeOtherSessions = () => {
    success('Sessions Revoked', '2 remote sessions have been forcefully terminated.')
  }

  const handleSave = () => {
    success('Security Policy Updated', 'Cryptographic protocol rules and MFA requirements enforced.')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Quantum Cryptography & Protocol Card */}
      <div className="nexus-glass-card rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Shield className="size-4 text-cyan-500" />
            <span>Post-Quantum TLS & Cryptographic Standards</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Configure lattice-based ML-KEM-768 encryption handshakes between browser sessions and API nodes.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-secondary/40">
            <div className="space-y-1">
              <div className="text-xs font-bold text-foreground">
                Strict Post-Quantum TLS Handshake
              </div>
              <p className="text-xs text-muted-foreground">
                Refuse connection handshakes from clients that do not support Kyber-768 or hybrid ECDH algorithms.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={quantumTls}
              onClick={() => setQuantumTls(!quantumTls)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                quantumTls
                  ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-muted-foreground/30'
              }`}
            >
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`inline-block size-4 rounded-full bg-white shadow-md transform ${
                  quantumTls ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-secondary/40">
            <div className="space-y-1">
              <div className="text-xs font-bold text-foreground">
                Hardware FIDO2 / WebAuthn MFA Enforcement
              </div>
              <p className="text-xs text-muted-foreground">
                Require a physical YubiKey or biometric enclave verification on all tier-3 incident resolution actions.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enforceMfa}
              onClick={() => setEnforceMfa(!enforceMfa)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enforceMfa
                  ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
              : 'bg-muted-foreground/30'
              }`}
            >
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`inline-block size-4 rounded-full bg-white shadow-md transform ${
                  enforceMfa ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <button
            onClick={handleSave}
            className="quantum-gradient-btn flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-md"
          >
            <Save className="size-3.5" />
            <span>Save Security Policy</span>
          </button>
        </div>
      </div>

      {/* Active Sessions Card */}
      <div className="nexus-glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Monitor className="size-4 text-cyan-500" />
            <h3 className="text-sm font-bold text-foreground">Active Signed-In Sessions</h3>
          </div>
          <button
            onClick={handleRevokeOtherSessions}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
          >
            Revoke All Other Sessions
          </button>
        </div>

        <div className="divide-y divide-border/60">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="py-3 flex items-center justify-between text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{sess.device}</span>
                  {sess.isCurrent && (
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 font-bold">
                      CURRENT DEVICE
                    </span>
                  )}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {sess.location} · {sess.lastActive}
                </div>
              </div>

              {!sess.isCurrent && (
                <button
                  onClick={() => info('Session Terminated', `Terminated ${sess.device}.`)}
                  className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
