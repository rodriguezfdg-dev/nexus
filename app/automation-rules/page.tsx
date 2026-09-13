'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu,
  Zap,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Edit2,
  Trash2,
  Copy,
  X,
  Sparkles,
  ArrowRight,
  Shield,
  Activity,
  Layers,
} from 'lucide-react'
import { useToast } from '@/components/nexus/toast-provider'
import { EmptyState } from '@/components/nexus/empty-state'

export interface AutomationRule {
  id: string
  name: string
  description: string
  trigger: string
  condition: string
  action: string
  status: 'active' | 'paused'
  executionCountToday: number
  lastTriggered: string
  category: 'Escalation' | 'Triage' | 'Self-Healing' | 'Security'
}

const initialRules: AutomationRule[] = [
  {
    id: 'RULE-801',
    name: 'Auto-Escalate P1 Incidents Unacknowledged in 5 Minutes',
    description: 'Bypasses standard queue when critical database or auth nodes fail to acknowledge within strict SLA threshold.',
    trigger: 'SLA Timer < 15m & Unacknowledged > 5m',
    condition: 'Priority == Critical && Env == Production',
    action: 'Dispatch On-Call Commander via Quantum Pager & Slack #war-room',
    status: 'active',
    executionCountToday: 38,
    lastTriggered: '4m ago',
    category: 'Escalation',
  },
  {
    id: 'RULE-802',
    name: 'Autonomous AI Triage & Runbook Injection',
    description: 'Uses NLP diagnostics to map stack traces to known runbooks and assign initial severity confidence.',
    trigger: 'New Quantum Incident Ticket Ingested',
    condition: 'AI Classifier Confidence >= 88%',
    action: 'Inject Verified Runbook, Tag Service, and Set Suggested RCA',
    status: 'active',
    executionCountToday: 312,
    lastTriggered: '12m ago',
    category: 'Triage',
  },
  {
    id: 'RULE-803',
    name: 'Kubernetes OOM-Kill Automatic Heap Profile Dump',
    description: 'Captures JVM and V8 heap snapshot immediately upon container memory termination signal.',
    trigger: 'Container Exit Code 137 (OOMKilled)',
    condition: 'Namespace in [production-core, api-gateways]',
    action: 'Archive Core Dump to S3 Vault & Attach Link to Ticket Timeline',
    status: 'active',
    executionCountToday: 14,
    lastTriggered: '1h ago',
    category: 'Self-Healing',
  },
  {
    id: 'RULE-804',
    name: 'Adaptive Rate-Limiting on Distributed Auth Anomaly',
    description: 'Throttles suspect API tokens experiencing > 50 consecutive failed cryptographic handshakes.',
    trigger: 'Failed Handshake Rate > 50/sec per IP/Subnet',
    condition: 'Service == Auth-Gateway',
    action: 'Engage Edge WAF Quantum Shield Mode & Revoke Session Tokens',
    status: 'paused',
    executionCountToday: 0,
    lastTriggered: '2 days ago',
    category: 'Security',
  },
  {
    id: 'RULE-805',
    name: 'PostgreSQL Replication Lag Standby Reroute',
    description: 'Automatically shifts non-transactional analytical queries away from lagging read replicas.',
    trigger: 'WAL Replication Lag > 3000ms for 60s',
    condition: 'Service == Postgres-Cluster && WorkloadType == Read',
    action: 'Drain Replica Connection Pool & Rebalance to Hot Standby Node',
    status: 'active',
    executionCountToday: 89,
    lastTriggered: '26m ago',
    category: 'Self-Healing',
  },
]

export default function AutomationRulesPage() {
  const [rules, setRules] = useState<AutomationRule[]>(initialRules)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)

  // Form states
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formTrigger, setFormTrigger] = useState('SLA Timer < 15m')
  const [formCondition, setFormCondition] = useState('Priority == Critical && Env == Production')
  const [formAction, setFormAction] = useState('Dispatch On-Call Commander via Quantum Pager')
  const [formCategory, setFormCategory] = useState<'Escalation' | 'Triage' | 'Self-Healing' | 'Security'>('Escalation')
  const [formStatus, setFormStatus] = useState<'active' | 'paused'>('active')

  const { success, warning, info } = useToast()

  // Toggle Rule Status with Animated Feedback
  const handleToggleStatus = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === ruleId) {
          const nextStatus = r.status === 'active' ? 'paused' : 'active'
          if (nextStatus === 'active') {
            success('Automation Rule Activated', `Rule #${r.id} is now actively executing on event triggers.`)
          } else {
            warning('Automation Rule Paused', `Rule #${r.id} execution suspended until resumed.`)
          }
          return { ...r, status: nextStatus }
        }
        return r
      })
    )
  }

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingRule(null)
    setFormName('')
    setFormDescription('')
    setFormTrigger('SLA Timer < 15m')
    setFormCondition('Priority == Critical && Env == Production')
    setFormAction('Dispatch On-Call Commander via Quantum Pager')
    setFormCategory('Escalation')
    setFormStatus('active')
    setModalOpen(true)
  }

  // Open modal for Edit
  const handleOpenEdit = (rule: AutomationRule) => {
    setEditingRule(rule)
    setFormName(rule.name)
    setFormDescription(rule.description)
    setFormTrigger(rule.trigger)
    setFormCondition(rule.condition)
    setFormAction(rule.action)
    setFormCategory(rule.category)
    setFormStatus(rule.status)
    setModalOpen(true)
  }

  // Save rule handler
  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    if (editingRule) {
      // Edit existing
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingRule.id
            ? {
                ...r,
                name: formName,
                description: formDescription,
                trigger: formTrigger,
                condition: formCondition,
                action: formAction,
                category: formCategory,
                status: formStatus,
              }
            : r
        )
      )
      success('Rule Updated', `Automation Rule #${editingRule.id} saved successfully.`)
    } else {
      // Create new
      const newId = `RULE-${Math.floor(800 + Math.random() * 200)}`
      const newRule: AutomationRule = {
        id: newId,
        name: formName,
        description: formDescription || 'Custom user-defined autonomous workflow policy.',
        trigger: formTrigger,
        condition: formCondition,
        action: formAction,
        category: formCategory,
        status: formStatus,
        executionCountToday: 0,
        lastTriggered: 'Just created',
      }
      setRules((prev) => [newRule, ...prev])
      success('Rule Created', `New Automation Rule #${newId} compiled and activated.`)
    }

    setModalOpen(false)
  }

  // Delete rule
  const handleDeleteRule = (ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId))
    info('Rule Removed', `Automation Rule #${ruleId} has been deleted.`)
  }

  // Duplicate rule
  const handleDuplicateRule = (rule: AutomationRule) => {
    const newId = `RULE-${Math.floor(800 + Math.random() * 200)}`
    const duplicated: AutomationRule = {
      ...rule,
      id: newId,
      name: `${rule.name} (Copy)`,
      executionCountToday: 0,
      lastTriggered: 'Just created',
      status: 'paused',
    }
    setRules((prev) => [duplicated, ...prev])
    success('Rule Duplicated', `Created copy #${newId} in paused state.`)
  }

  // Filter rules
  const filteredRules = rules.filter((r) => {
    if (statusFilter === 'active' && r.status !== 'active') return false
    if (statusFilter === 'paused' && r.status !== 'paused') return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      r.name.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.trigger.toLowerCase().includes(q) ||
      r.action.toLowerCase().includes(q)
    )
  })

  const activeCount = rules.filter((r) => r.status === 'active').length
  const totalExecutions = rules.reduce((acc, r) => acc + r.executionCountToday, 0)

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1.5">
              <Cpu className="size-3 text-cyan-500" />
              Autonomous Policy Engine
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              v2.40 · Event-Driven Architecture
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Automation Rules & Quantum Triggers
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Configure declarative event chains (Trigger → Condition → Action) to automate tier escalations, self-healing runbooks, and telemetry responses.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="quantum-gradient-btn flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-md"
        >
          <Plus className="size-4" />
          <span>New Automation Rule</span>
        </button>
      </div>

      {/* 2. Top Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="nexus-glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>ACTIVE POLICIES</span>
            <Cpu className="size-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black font-mono text-foreground">
            {activeCount} <span className="text-xs text-muted-foreground font-normal">/ {rules.length} Total</span>
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            All execution workers operational
          </div>
        </div>

        <div className="nexus-glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>ACTIONS TODAY</span>
            <Zap className="size-4 text-violet-500" />
          </div>
          <div className="text-2xl font-black font-mono text-violet-600 dark:text-violet-400">
            {totalExecutions.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground font-semibold">
            Autonomous triggers executed
          </div>
        </div>

        <div className="nexus-glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>AVG RESPONSE TIME</span>
            <Activity className="size-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            180ms
          </div>
          <div className="text-xs text-muted-foreground font-semibold">
            Event loop trigger latency
          </div>
        </div>

        <div className="nexus-glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>EXECUTION ACCURACY</span>
            <Shield className="size-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
            99.94%
          </div>
          <div className="text-xs text-muted-foreground font-semibold">
            0 unexpected condition failures
          </div>
        </div>
      </div>

      {/* 3. Search & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          {(['all', 'active', 'paused'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                statusFilter === tab
                  ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent'
              }`}
            >
              {tab === 'all' ? 'All Rules' : tab}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rules, triggers, actions..."
            className="w-full rounded-xl border border-border bg-card/80 pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* 4. Rules List */}
      {filteredRules.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredRules.map((rule) => {
              const isActive = rule.status === 'active'

              return (
                <motion.div
                  key={rule.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className={`nexus-glass-card rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:border-cyan-500/40 group relative overflow-hidden ${
                    !isActive ? 'opacity-70 bg-muted/20' : ''
                  }`}
                >
                  {/* Top Bar: ID, Category & Toggle Switch */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                        #{rule.id}
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-border bg-secondary text-muted-foreground font-semibold">
                        {rule.category}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        Fired {rule.executionCountToday}x today · Last {rule.lastTriggered}
                      </span>
                    </div>

                    {/* Animated Toggle Switch */}
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground">
                        {isActive ? 'Active' : 'Paused'}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isActive}
                        onClick={() => handleToggleStatus(rule.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
                          isActive
                            ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                            : 'bg-muted-foreground/30'
                        }`}
                        title={isActive ? 'Click to Pause Rule' : 'Click to Activate Rule'}
                      >
                        <motion.span
                          layout
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className={`inline-block size-4 rounded-full bg-white shadow-md transform ${
                            isActive ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Rule Name & Description */}
                  <div className="mt-3">
                    <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {rule.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {rule.description}
                    </p>
                  </div>

                  {/* Declarative Flow: Trigger → Condition → Action */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl border border-border/80 bg-secondary/40">
                    {/* Trigger Node */}
                    <div className="space-y-1">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-cyan-500" />
                        WHEN (TRIGGER)
                      </div>
                      <div className="font-mono text-xs font-semibold text-foreground break-words">
                        {rule.trigger}
                      </div>
                    </div>

                    {/* Condition Node */}
                    <div className="space-y-1 border-t md:border-t-0 md:border-l border-border/60 pt-2 md:pt-0 md:pl-3">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-violet-600 dark:text-violet-400 font-bold flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-violet-500" />
                        IF (CONDITION)
                      </div>
                      <div className="font-mono text-xs font-semibold text-foreground break-words">
                        {rule.condition}
                      </div>
                    </div>

                    {/* Action Node */}
                    <div className="space-y-1 border-t md:border-t-0 md:border-l border-border/60 pt-2 md:pt-0 md:pl-3">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        THEN (ACTION)
                      </div>
                      <div className="font-mono text-xs font-semibold text-foreground break-words">
                        {rule.action}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(rule)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-secondary text-foreground transition font-medium"
                      >
                        <Edit2 className="size-3 text-cyan-500" />
                        <span>Configure / Edit</span>
                      </button>

                      <button
                        onClick={() => handleDuplicateRule(rule)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition font-medium"
                      >
                        <Copy className="size-3" />
                        <span>Duplicate</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 rounded-lg border border-transparent hover:border-rose-500/30 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition"
                      title="Delete Automation Rule"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState
          icon={Cpu}
          badgeTone="cyan"
          badgeText="WORKFLOW: NO MATCHES"
          title="No Automation Rules Found"
          description="No automation policies matched your current search term or filter status."
          action={{
            label: 'Create New Rule',
            icon: Plus,
            onClick: handleOpenCreate,
          }}
          secondaryAction={{
            label: 'Reset Filters',
            onClick: () => {
              setSearchQuery('')
              setStatusFilter('all')
            },
          }}
        />
      )}

      {/* 5. Create / Edit Automation Rule Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-popover/95 p-6 shadow-2xl backdrop-blur-2xl z-10 select-none text-foreground"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                    <Cpu className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {editingRule ? `Edit Rule #${editingRule.id}` : 'Create New Automation Rule'}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Event-driven declarative workflow pipeline configuration
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveRule} className="mt-4 space-y-4 text-xs">
                {/* Rule Name */}
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Rule Title / Policy Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Auto-Dispatch SecOps on High-Severity Auth Failure"
                    className="w-full rounded-xl border border-border bg-secondary/60 px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500 transition"
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Description & Objectives
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Provide operational context for why this trigger executes..."
                    className="w-full rounded-xl border border-border bg-secondary/60 px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500 transition resize-none"
                  />
                </div>

                {/* Declarative Flow Fields */}
                <div className="space-y-3 p-3.5 rounded-xl border border-border bg-secondary/30">
                  {/* Trigger */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 mb-1">
                      WHEN (Trigger Event)
                    </label>
                    <select
                      value={formTrigger}
                      onChange={(e) => setFormTrigger(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground outline-none focus:border-cyan-500"
                    >
                      <option value="SLA Timer < 15m & Unacknowledged > 5m">SLA Timer &lt; 15m & Unacknowledged &gt; 5m</option>
                      <option value="New Quantum Incident Ticket Ingested">New Quantum Incident Ticket Ingested</option>
                      <option value="Container Exit Code 137 (OOMKilled)">Container Exit Code 137 (OOMKilled)</option>
                      <option value="WAL Replication Lag > 3000ms for 60s">WAL Replication Lag &gt; 3000ms for 60s</option>
                      <option value="Failed Handshake Rate > 50/sec per IP/Subnet">Failed Handshake Rate &gt; 50/sec per IP/Subnet</option>
                    </select>
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400 mb-1">
                      IF (Matching Condition)
                    </label>
                    <input
                      type="text"
                      required
                      value={formCondition}
                      onChange={(e) => setFormCondition(e.target.value)}
                      placeholder="e.g. Priority == Critical && Env == Production"
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground outline-none focus:border-violet-500"
                    />
                  </div>

                  {/* Action */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                      THEN (Autonomous Action)
                    </label>
                    <select
                      value={formAction}
                      onChange={(e) => setFormAction(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground outline-none focus:border-emerald-500"
                    >
                      <option value="Dispatch On-Call Commander via Quantum Pager & Slack #war-room">Dispatch On-Call Commander via Quantum Pager & Slack #war-room</option>
                      <option value="Inject Verified Runbook, Tag Service, and Set Suggested RCA">Inject Verified Runbook, Tag Service, and Set Suggested RCA</option>
                      <option value="Drain Replica Connection Pool & Rebalance to Hot Standby Node">Drain Replica Connection Pool & Rebalance to Hot Standby Node</option>
                      <option value="Archive Core Dump to S3 Vault & Attach Link to Ticket Timeline">Archive Core Dump to S3 Vault & Attach Link to Ticket Timeline</option>
                      <option value="Engage Edge WAF Quantum Shield Mode & Revoke Session Tokens">Engage Edge WAF Quantum Shield Mode & Revoke Session Tokens</option>
                    </select>
                  </div>
                </div>

                {/* Category & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">
                      Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full rounded-xl border border-border bg-secondary/60 px-2.5 py-2 text-foreground outline-none focus:border-cyan-500"
                    >
                      <option value="Escalation">Escalation</option>
                      <option value="Triage">Triage</option>
                      <option value="Self-Healing">Self-Healing</option>
                      <option value="Security">Security</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">
                      Initial Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full rounded-xl border border-border bg-secondary/60 px-2.5 py-2 text-foreground outline-none focus:border-cyan-500"
                    >
                      <option value="active">Active (Immediate Execution)</option>
                      <option value="paused">Paused (Draft Mode)</option>
                    </select>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl border border-border bg-secondary/60 px-4 py-2 font-semibold text-muted-foreground hover:text-foreground transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="quantum-gradient-btn rounded-xl px-5 py-2 font-bold shadow-md"
                  >
                    {editingRule ? 'Save Changes' : 'Compile & Save Rule'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
