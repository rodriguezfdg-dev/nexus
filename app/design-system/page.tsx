'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CardSkeleton,
  KpiCardSkeleton,
  TableRowSkeleton,
  TableSkeleton,
} from '@/components/nexus/state-skeletons'
import { EmptyState } from '@/components/nexus/empty-state'
import { ReportModal } from '@/components/nexus/report-modal'
import { useToast } from '@/components/nexus/toast-provider'
import {
  Sparkles,
  Layers,
  FileText,
  BellRing,
  Inbox,
  ShieldCheck,
  Search,
  FilterX,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Info,
  RotateCcw,
  Sliders,
  ExternalLink,
  Code2,
  Eye,
  Activity,
  ArrowRight,
} from 'lucide-react'

export default function DesignSystemPage() {
  // State for Skeleton Section
  const [showSkeleton, setShowSkeleton] = useState(true)

  // State for Empty State Section
  const [emptyStateScenario, setEmptyStateScenario] = useState<'zero-incidents' | 'search-empty' | 'security-clear'>('zero-incidents')

  // State for Report Modal Section
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [simulateReportFailure, setSimulateReportFailure] = useState(false)

  // Toast hook
  const { success, warning, critical, info } = useToast()

  // Custom toast playground state
  const [customToastTitle, setCustomToastTitle] = useState('Deployment Succeeded')
  const [customToastDesc, setCustomToastDesc] = useState('Cluster US-East-01 completed rolling upgrade without downtime.')
  const [customToastType, setCustomToastType] = useState<'success' | 'warning' | 'critical' | 'info'>('success')

  const triggerCustomToast = () => {
    if (customToastType === 'success') success(customToastTitle, customToastDesc)
    else if (customToastType === 'warning') warning(customToastTitle, customToastDesc)
    else if (customToastType === 'critical') critical(customToastTitle, customToastDesc)
    else info(customToastTitle, customToastDesc)
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-12 pb-16">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-card/75 dark:bg-[#070e1a]/85 p-6 sm:p-8 md:p-10 backdrop-blur-2xl shadow-2xl">
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-bold tracking-wider uppercase border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Sparkles className="size-3.5" />
              Nexus Design System & State Architecture
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              v2.4.0 · Theme-Synchronized State UI
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            NexusDesk Shared Component Showcase
          </h1>

          <p className="max-w-3xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Centralized gallery demonstrating the 4 core reusable state components built for NexusDesk:
            theme-aware shimmer skeletons, floating animated empty states, sequential console-style report compilation modal, and auto-dismiss toast alerts.
          </p>

          {/* Quick navigation anchor pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              { id: 'skeletons', label: '1. Skeleton Loaders', icon: Layers },
              { id: 'empty-states', label: '2. Empty State Components', icon: Inbox },
              { id: 'report-modal', label: '3. Report Generation Modal', icon: FileText },
              { id: 'toasts', label: '4. Toast Notifications', icon: BellRing },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary hover:border-cyan-500/40 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
              >
                <item.icon className="size-3.5 text-cyan-500" />
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Ambient radial glow background */}
        <div className="absolute -top-24 -right-24 size-80 rounded-full bg-cyan-500/15 dark:bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-80 rounded-full bg-violet-500/15 dark:bg-violet-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: SKELETON LOADERS */}
      {/* ========================================================================= */}
      <section id="skeletons" className="space-y-6 pt-4 scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase">
                Section 01
              </span>
              <span className="text-muted-foreground">/</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                Theme-Aware Skeleton Loaders
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Smooth shimmer sweep animation tailored for both light mode and dark mode using cyan and violet brand gradients.
            </p>
          </div>

          {/* Toggle between skeleton and populated mock data */}
          <div className="flex items-center gap-3 bg-secondary/70 border border-border px-3.5 py-1.5 rounded-xl">
            <span className="text-xs font-semibold text-foreground">
              {showSkeleton ? 'Skeleton Mode' : 'Populated Card Mode'}
            </span>
            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              className="quantum-gradient-btn flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition shadow-sm"
            >
              <Eye className="size-3.5" />
              <span>Toggle State</span>
            </button>
          </div>
        </div>

        {/* 1.A: KPI Skeletons */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold">
              1.A — KPI Card Skeletons (Grid)
            </h3>
            <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400">
              Matches Top KPI Row on /dashboard
            </span>
          </div>

          {showSkeleton ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="nexus-glass-card rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span>ACTIVE INCIDENTS</span>
                  <Activity className="size-4 text-rose-500" />
                </div>
                <div className="text-2xl font-black font-mono text-foreground">14</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">-2 since last shift</div>
              </div>
              <div className="nexus-glass-card rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span>SLA BREACH RISK</span>
                  <AlertTriangle className="size-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">3 P1s</div>
                <div className="text-xs text-amber-600 font-semibold">&lt; 15m remaining</div>
              </div>
              <div className="nexus-glass-card rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span>MTTR (HOURLY)</span>
                  <Activity className="size-4 text-cyan-500" />
                </div>
                <div className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400">14.2m</div>
                <div className="text-xs text-muted-foreground font-semibold">Median response time</div>
              </div>
              <div className="nexus-glass-card rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span>AI RESOLUTION</span>
                  <Sparkles className="size-4 text-violet-500" />
                </div>
                <div className="text-2xl font-black font-mono text-violet-600 dark:text-violet-400">74.8%</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">+12% auto-healed</div>
              </div>
            </div>
          )}
        </div>

        {/* 1.B: Card Skeletons */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold">
              1.B — Ticket / Card Skeletons
            </h3>
            <span className="font-mono text-[11px] text-muted-foreground">
              Includes monospace ID, tags, assignee & SLA timer placeholders
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {showSkeleton ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              [
                { id: '#NX-8942', title: 'Postgres Replica Replication Lag Spike', priority: 'Critical', tag: 'Database', user: 'Sarah Lin', sla: '08m 14s' },
                { id: '#NX-8935', title: 'Auth-Gateway IAM Token Expired', priority: 'High', tag: 'Auth/IAM', user: 'AI Quantum Agent', sla: '34m 20s' },
                { id: '#NX-8921', title: 'Kafka Telemetry Pipeline Throttling', priority: 'Normal', tag: 'Kafka', user: 'Marcus Vance', sla: '02h 10m' },
              ].map((card) => (
                <div key={card.id} className="nexus-glass-card rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">{card.id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
                      {card.priority}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{card.title}</h4>
                    <p className="text-[11px] text-muted-foreground mt-1">Cluster node telemetry alert triggered automatically.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">{card.tag}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border/60">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-cyan-500/20 text-cyan-500 flex items-center justify-center text-[10px] font-bold">
                        {card.user.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs text-foreground font-medium">{card.user}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-rose-500">{card.sla}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 1.C: Table Row Skeletons */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold">
              1.C — Table Row & Table Skeleton
            </h3>
            <span className="font-mono text-[11px] text-muted-foreground">
              Used in audit logs, user lists, and dense incident queues
            </span>
          </div>

          <TableSkeleton rows={4} />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: EMPTY STATES */}
      {/* ========================================================================= */}
      <section id="empty-states" className="space-y-6 pt-8 scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400 uppercase">
                Section 02
              </span>
              <span className="text-muted-foreground">/</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                Empty State Component
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Gentle floating & pulsing orbital icon animation + technical badge + responsive action triggers.
            </p>
          </div>

          {/* Scenario Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl border border-border bg-secondary/60">
            {[
              { id: 'zero-incidents', label: 'All Systems Green' },
              { id: 'search-empty', label: 'Search 0 Results' },
              { id: 'security-clear', label: 'Audit Clean' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setEmptyStateScenario(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  emptyStateScenario === tab.id
                    ? 'bg-card text-cyan-600 dark:text-cyan-400 shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Empty State Demonstration */}
        <div className="w-full">
          {emptyStateScenario === 'zero-incidents' && (
            <EmptyState
              icon={ShieldCheck}
              badgeTone="emerald"
              badgeText="STATUS: ZERO BREACHES"
              title="All Production Clusters Operational"
              description="No active incidents or SLA risk triggers currently queued across US-East or EU-West telemetry nodes."
              action={{
                label: 'Compile SLA Audit Report',
                icon: FileText,
                onClick: () => setReportModalOpen(true),
              }}
              secondaryAction={{
                label: 'Simulate Telemetry Test',
                icon: Activity,
                onClick: () => info('Simulation Launched', 'Synthetic traffic pulse injected into test harness.'),
              }}
            />
          )}

          {emptyStateScenario === 'search-empty' && (
            <EmptyState
              icon={FilterX}
              badgeTone="cyan"
              badgeText="FILTER: NO MATCHES"
              title="No Incidents Match Selected Query"
              description="Your current combination of tags, tier assignee, and severity filters yielded 0 results in the active queue."
              action={{
                label: 'Reset Filters to Default',
                icon: RotateCcw,
                variant: 'primary',
                onClick: () => success('Filters Reset', 'All filter facets returned to initial view.'),
              }}
              secondaryAction={{
                label: 'Create Custom Filter Preset',
                onClick: () => info('Filter Preset', 'Saved current view configuration to preferences.'),
              }}
            />
          )}

          {emptyStateScenario === 'security-clear' && (
            <EmptyState
              icon={Inbox}
              badgeTone="violet"
              badgeText="AUDIT LOG: BUFFER EMPTY"
              title="Zero Security Anomaly Logs"
              description="AI quantum IDS analyzer has not flagged any anomalous authentication attempts or permission escalations in the last 24 hours."
              action={{
                label: 'Export Security Certificate',
                icon: FileText,
                onClick: () => success('Certificate Exported', 'Cryptographic compliance proof generated.'),
              }}
            />
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: REPORT GENERATION MODAL */}
      {/* ========================================================================= */}
      <section id="report-modal" className="space-y-6 pt-8 scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase">
                Section 03
              </span>
              <span className="text-muted-foreground">/</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                Sequential Report Generation Modal
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Sequential console-style progress, checkmarks, shimmer progress bar, monospace estimated timer, cancelation, and toggleable success/error handling.
            </p>
          </div>
        </div>

        {/* Modal Showcase Card with Trigger Controls */}
        <div className="nexus-glass-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold uppercase">
                  Sequential Async Engine
                </span>
                <span className="text-xs text-muted-foreground font-mono">4 Discrete Telemetry Steps</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Executive SLA & Incident Post-Mortem Compiler
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Click below to open the modal. Watch the sequential progress steps resolve in real-time,
                test the cancellation button, or toggle "Simulate Telemetry Failure" to inspect the amber error state and retry mechanism.
              </p>
            </div>

            {/* Launch Modal Trigger Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  setSimulateReportFailure(false)
                  setReportModalOpen(true)
                }}
                className="quantum-gradient-btn flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold shadow-lg"
              >
                <FileText className="size-4" />
                <span>Launch Modal (Success Flow)</span>
              </button>

              <button
                onClick={() => {
                  setSimulateReportFailure(true)
                  setReportModalOpen(true)
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold transition shadow-sm"
              >
                <AlertTriangle className="size-4 text-amber-500" />
                <span>Launch Modal (Error Flow)</span>
              </button>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border/60">
            <div className="rounded-xl border border-border bg-secondary/40 p-3.5 space-y-1">
              <div className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400">01. Sequential Steps</div>
              <div className="text-[11px] text-muted-foreground">
                Console-style telemetry items each fade in with a spinning loader and resolve to emerald checkmarks.
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary/40 p-3.5 space-y-1">
              <div className="font-mono text-[11px] font-bold text-violet-600 dark:text-violet-400">02. Shimmer Progress</div>
              <div className="text-[11px] text-muted-foreground">
                Smooth percentage calculation overlayed with a neon gradient shimmer sweep.
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary/40 p-3.5 space-y-1">
              <div className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">03. Bouncing Download</div>
              <div className="text-[11px] text-muted-foreground">
                Success state animates a bouncing download button with cryptographic SHA-256 hash.
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary/40 p-3.5 space-y-1">
              <div className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">04. Error & Retry</div>
              <div className="text-[11px] text-muted-foreground">
                Amber failure screen with node error diagnosis and a 1-click retry generation handler.
              </div>
            </div>
          </div>
        </div>

        {/* The Actual Reusable Report Modal Instance */}
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          reportTitle="Q3 Operational SLA & Post-Mortem Report"
          scope="Multi-Region Node Telemetry · Past 30 Days"
          simulateErrorDefault={simulateReportFailure}
        />
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: TOAST NOTIFICATIONS */}
      {/* ========================================================================= */}
      <section id="toasts" className="space-y-6 pt-8 scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                Section 04
              </span>
              <span className="text-muted-foreground">/</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                Toast Notification Engine
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Corner slide-in with auto-dismiss progress countdown bar, pause on hover, and 4 theme variants (Success, Warning, Critical, Info).
            </p>
          </div>
        </div>

        {/* 4 Variant Quick Trigger Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Success */}
          <button
            onClick={() =>
              success(
                'Incident Resolved',
                'Ticket #NX-8942 marked as resolved. SLA met with 04m remaining.'
              )
            }
            className="flex flex-col items-start p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-left transition-all group shadow-sm"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                <CheckCircle2 className="size-4" />
              </div>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                EMERALD
              </span>
            </div>
            <div className="mt-3 font-bold text-xs text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Trigger Success Toast
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Indicates resolved tickets, successful deploys, or saved rules.
            </p>
          </button>

          {/* 2. Warning */}
          <button
            onClick={() =>
              warning(
                'SLA Breach Imminent',
                'Ticket #NX-8935 has less than 12 minutes remaining before SLA penalty.'
              )
            }
            className="flex flex-col items-start p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-left transition-all group shadow-sm"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
                <AlertTriangle className="size-4" />
              </div>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                AMBER
              </span>
            </div>
            <div className="mt-3 font-bold text-xs text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Trigger Warning Toast
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Warns of SLA risk, expiring auth tokens, or node latency spikes.
            </p>
          </button>

          {/* 3. Critical */}
          <button
            onClick={() =>
              critical(
                'Cluster Node Offline',
                'Node us-east-04 failed heartbeat checks. Auto-rerouting active sessions.'
              )
            }
            className="flex flex-col items-start p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-left transition-all group shadow-sm"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex size-8 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500 border border-rose-500/30">
                <Flame className="size-4" />
              </div>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
                ROSE
              </span>
            </div>
            <div className="mt-3 font-bold text-xs text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              Trigger Critical Toast
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              High-priority alarms, system crashes, or P1 incident dispatches.
            </p>
          </button>

          {/* 4. Info */}
          <button
            onClick={() =>
              info(
                'AI Copilot Synced',
                'Quantum runbook updated with 12 newly analyzed incident post-mortems.'
              )
            }
            className="flex flex-col items-start p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 text-left transition-all group shadow-sm"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex size-8 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-500 border border-cyan-500/30">
                <Sparkles className="size-4" />
              </div>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold">
                CYAN
              </span>
            </div>
            <div className="mt-3 font-bold text-xs text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              Trigger Info Toast
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Informational updates, AI recommendations, and background tasks.
            </p>
          </button>
        </div>

        {/* Custom Toast Playground Form */}
        <div className="nexus-glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
              <Sliders className="size-4 text-cyan-500" />
              <span>Interactive Toast Playground</span>
            </h3>
            <span className="font-mono text-[10px] text-muted-foreground">
              Auto-dismiss Progress Countdown Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Notification Variant
              </label>
              <select
                value={customToastType}
                onChange={(e) => setCustomToastType(e.target.value as any)}
                className="w-full rounded-xl border border-border bg-secondary/60 px-3 py-2 text-xs text-foreground outline-none focus:border-cyan-500"
              >
                <option value="success">Success (Emerald)</option>
                <option value="warning">Warning (Amber)</option>
                <option value="critical">Critical (Rose)</option>
                <option value="info">Info (Cyan)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Toast Title
              </label>
              <input
                type="text"
                value={customToastTitle}
                onChange={(e) => setCustomToastTitle(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/60 px-3 py-2 text-xs text-foreground outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Description / Message
              </label>
              <input
                type="text"
                value={customToastDesc}
                onChange={(e) => setCustomToastDesc(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/60 px-3 py-2 text-xs text-foreground outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={triggerCustomToast}
              className="quantum-gradient-btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md"
            >
              <BellRing className="size-3.5" />
              <span>Fire Toast Notification</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
