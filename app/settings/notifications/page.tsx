'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  AlertTriangle,
  Flame,
  Radio,
  Save,
  CheckCircle2,
  Sliders,
} from 'lucide-react'
import { useToast } from '@/components/nexus/toast-provider'

interface NotificationChannel {
  id: string
  name: string
  description: string
  enabled: boolean
  target: string
  frequency: string
}

export default function SettingsNotificationsPage() {
  const [channels, setChannels] = useState<NotificationChannel[]>([
    {
      id: 'pagerduty',
      name: 'PagerDuty Quantum High-Urgency Webhook',
      description: 'Dispatches phone calls and instant push alerts for critical P1 incidents approaching SLA penalty.',
      enabled: true,
      target: 'Key: pd_live_secops_tier3_primary',
      frequency: 'Immediate (< 60s)',
    },
    {
      id: 'slack',
      name: 'Slack #incident-war-room Dispatcher',
      description: 'Broadcasts new tickets, automated root-cause analyses, and status updates directly to engineering channels.',
      enabled: true,
      target: 'Channel: #war-room-production',
      frequency: 'Real-time',
    },
    {
      id: 'email-digest',
      name: 'Executive Daily Operations & SLA Digest',
      description: 'Daily aggregated PDF metrics report sent to engineering leadership and compliance auditors.',
      enabled: false,
      target: 'Recipients: sre-leadership@nexus.internal',
      frequency: 'Daily at 08:00 UTC',
    },
    {
      id: 'browser-push',
      name: 'Browser WebPush Telemetry Alerts',
      description: 'In-app corner toast notifications and audio chimes when assigned tickets require immediate action.',
      enabled: true,
      target: 'Current Browser Session',
      frequency: 'Instant',
    },
  ])

  const { success, warning } = useToast()

  const toggleChannel = (id: string) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === id) {
          const next = !ch.enabled
          if (next) {
            success('Channel Enabled', `${ch.name} will receive alerts.`)
          } else {
            warning('Channel Disabled', `${ch.name} alerts muted.`)
          }
          return { ...ch, enabled: next }
        }
        return ch
      })
    )
  }

  const handleSave = () => {
    success('Alert Preferences Saved', 'All notification routing webhooks and frequency rules updated.')
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
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Bell className="size-4 text-cyan-500" />
            <span>Alert Escalation Channels & Webhooks</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Configure how and where NexusDesk dispatches high-urgency SLA breach alarms and automated incident resolution notices.
          </p>
        </div>

        {/* Channels List */}
        <div className="space-y-4">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className={`p-4 rounded-xl border border-border/80 bg-secondary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                !channel.enabled ? 'opacity-60 bg-muted/20' : ''
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    {channel.name}
                  </span>
                  <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold px-2 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/20">
                    {channel.frequency}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {channel.description}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground pt-0.5">
                  {channel.target}
                </p>
              </div>

              {/* Animated Switch */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  role="switch"
                  aria-checked={channel.enabled}
                  onClick={() => toggleChannel(channel.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    channel.enabled
                      ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'bg-muted-foreground/30'
                  }`}
                >
                  <motion.span
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`inline-block size-4 rounded-full bg-white shadow-md transform ${
                      channel.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <button
            onClick={handleSave}
            className="quantum-gradient-btn flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-md"
          >
            <Save className="size-3.5" />
            <span>Save Notification Preferences</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
