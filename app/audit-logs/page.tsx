'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Shield,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Lock,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Code2,
  Calendar,
  Layers,
} from 'lucide-react'
import { TableSkeleton } from '@/components/nexus/state-skeletons'
import { EmptyState } from '@/components/nexus/empty-state'
import { useToast } from '@/components/nexus/toast-provider'

export interface AuditEvent {
  id: string
  event: string
  category: 'Security' | 'Infrastructure' | 'Policy' | 'AI'
  actor: {
    name: string
    email: string
    isDaemon?: boolean
  }
  sourceIp: string
  node: string
  status: 'Approved' | 'Success' | 'Audited' | 'Denied'
  timestamp: string
  sha256: string
  metadata: Record<string, any>
}

const allAuditEvents: AuditEvent[] = [
  {
    id: 'AUD-9104',
    event: 'IAM Role Policy Modified: DevOps-Admin Escalation',
    category: 'Security',
    actor: { name: 'Alex Thorne', email: 'alex.thorne@nexus.internal' },
    sourceIp: '192.168.1.42',
    node: 'us-east-core-01',
    status: 'Approved',
    timestamp: '4m ago',
    sha256: '9f82c41890a2b7e189d9e4a3',
    metadata: { action: 'iam:PutRolePolicy', target: 'arn:nexus:iam::devops-admin', approvedBy: 'SecOps-MFA' },
  },
  {
    id: 'AUD-9103',
    event: 'Quantum Mesh TLS Key Rotation Synchronized',
    category: 'Infrastructure',
    actor: { name: 'KMS Worker Daemon', email: 'kms-daemon@internal.mesh', isDaemon: true },
    sourceIp: '10.0.0.1',
    node: 'global-kms-mesh',
    status: 'Success',
    timestamp: '18m ago',
    sha256: 'a1b7e4920c8f12d456e789a0',
    metadata: { keyId: 'key-quantum-kyber-768', rotatedNodes: 128, algorithm: 'ML-KEM-768' },
  },
  {
    id: 'AUD-9102',
    event: 'Emergency SSH Bastion Ingress Terminal Spawned',
    category: 'Security',
    actor: { name: 'Elena Rostova', email: 'tier3-oncall@nexus.internal' },
    sourceIp: '172.16.4.12',
    node: 'bastion-us-east',
    status: 'Audited',
    timestamp: '42m ago',
    sha256: 'c4e91280fa1b7d8e90c234a1',
    metadata: { reason: 'P1 Incident #NX-8942 DB WAL Contention', durationLimit: '60m', ttySession: 'active' },
  },
  {
    id: 'AUD-9101',
    event: 'Automated AI Remediation Plan Dispatched',
    category: 'AI',
    actor: { name: 'Quantum AI Agent', email: 'ai-triage@nexus.internal', isDaemon: true },
    sourceIp: '10.244.0.15',
    node: 'ai-copilot-cluster',
    status: 'Success',
    timestamp: '1h ago',
    sha256: '8b7a1920ef0123c4d5e6789a',
    metadata: { runbookId: 'RB-101', confidence: 0.94, targetTicket: '#NX-8942' },
  },
  {
    id: 'AUD-9100',
    event: 'PostgreSQL Database Snapshot Exported to Cold Vault',
    category: 'Infrastructure',
    actor: { name: 'Backup Worker v4', email: 'backup-agent@storage.internal', isDaemon: true },
    sourceIp: '10.0.4.88',
    node: 'patroni-storage-02',
    status: 'Success',
    timestamp: '2h ago',
    sha256: '3f90a128b7e4c190d234e567',
    metadata: { snapshotBytes: '4.8 TB', encryption: 'AES-256-GCM', targetS3: 's3://nexus-db-backups-vault' },
  },
  {
    id: 'AUD-9099',
    event: 'Unauthorized Admin Console Access Blocked',
    category: 'Security',
    actor: { name: 'Unknown Client', email: 'anonymous@198.51.100.89' },
    sourceIp: '198.51.100.89',
    node: 'edge-ingress-eu-west',
    status: 'Denied',
    timestamp: '3h ago',
    sha256: '0a1b2c3d4e5f678901234567',
    metadata: { reason: 'Invalid client certificate & failed quantum handshake', threatScore: 98 },
  },
  {
    id: 'AUD-9098',
    event: 'Automation Rule #RULE-801 Threshold Reconfigured',
    category: 'Policy',
    actor: { name: 'Marcus Vance', email: 'marcus.vance@nexus.internal' },
    sourceIp: '192.168.1.18',
    node: 'policy-worker-01',
    status: 'Approved',
    timestamp: '5h ago',
    sha256: '5d6e7f8a9b0c1d2e3f4a5b6c',
    metadata: { ruleId: 'RULE-801', fieldChanged: 'triggerTimeout', oldValue: '10m', newValue: '5m' },
  },
  {
    id: 'AUD-9097',
    event: 'Kubernetes Pod Security Admission Policy Enforced',
    category: 'Policy',
    actor: { name: 'K8s Admission Webhook', email: 'webhook@k8s.internal', isDaemon: true },
    sourceIp: '10.96.0.1',
    node: 'k8s-control-plane-01',
    status: 'Success',
    timestamp: '7h ago',
    sha256: '7c8d9e0f1a2b3c4d5e6f7a8b',
    metadata: { policy: 'restricted', namespace: 'default', rejectedContainers: 0 },
  },
  {
    id: 'AUD-9096',
    event: 'API Gateway Rate-Limit Threshold Escalated',
    category: 'Infrastructure',
    actor: { name: 'Alex Thorne', email: 'alex.thorne@nexus.internal' },
    sourceIp: '192.168.1.42',
    node: 'api-gateway-us-east',
    status: 'Approved',
    timestamp: '11h ago',
    sha256: '9a0b1c2d3e4f5a6b7c8d9e0f',
    metadata: { maxRps: 50000, burst: 75000, zone: 'us-east' },
  },
  {
    id: 'AUD-9095',
    event: 'AI Copilot Runbook Database Index Re-generated',
    category: 'AI',
    actor: { name: 'AI Indexer Service', email: 'rag-daemon@internal.ai', isDaemon: true },
    sourceIp: '10.244.2.80',
    node: 'vector-db-node-01',
    status: 'Success',
    timestamp: '14h ago',
    sha256: '1f2e3d4c5b6a798012345678',
    metadata: { indexedDocuments: 480, embeddingDimension: 1536, durationMs: 4200 },
  },
  {
    id: 'AUD-9094',
    event: 'Security Alert Rule #SEC-402 Triggered: Port Scan',
    category: 'Security',
    actor: { name: 'WAF Threat Engine', email: 'threat-engine@nexus.internal', isDaemon: true },
    sourceIp: '203.0.113.45',
    node: 'edge-firewall-02',
    status: 'Audited',
    timestamp: '18h ago',
    sha256: '2a3b4c5d6e7f8a9b0c1d2e3f',
    metadata: { probedPorts: [22, 443, 8080, 5432], actionTaken: 'BGP Blackhole Route Injected' },
  },
  {
    id: 'AUD-9093',
    event: 'Database Failover Dry-Run Simulation Executed',
    category: 'Infrastructure',
    actor: { name: 'Sarah Lin', email: 'sarah.lin@nexus.internal' },
    sourceIp: '192.168.1.15',
    node: 'patroni-standby-03',
    status: 'Success',
    timestamp: '1d ago',
    sha256: '4b5c6d7e8f9a0b1c2d3e4f5a',
    metadata: { simulatedRTO: '4.2s', simulatedRPO: '0 bytes', testCluster: 'staging-postgres-01' },
  },
]

const ITEMS_PER_PAGE = 6

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Security' | 'Infrastructure' | 'Policy' | 'AI'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [inspectEvent, setInspectEvent] = useState<AuditEvent | null>(null)

  const { success, info } = useToast()

  // Brief shimmer skeleton whenever filter or page changes
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 320)
    return () => clearTimeout(timer)
  }, [categoryFilter, currentPage])

  // Filter events
  const filteredEvents = allAuditEvents
    .filter((ev) => {
      if (categoryFilter !== 'all' && ev.category !== categoryFilter) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        ev.id.toLowerCase().includes(q) ||
        ev.event.toLowerCase().includes(q) ||
        ev.actor.name.toLowerCase().includes(q) ||
        ev.actor.email.toLowerCase().includes(q) ||
        ev.sourceIp.includes(q) ||
        ev.node.toLowerCase().includes(q)
      )
    })

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / ITEMS_PER_PAGE))
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleExport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filteredEvents, null, 2)
    )}`
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', jsonString)
    downloadAnchor.setAttribute('download', `nexus-audit-ledger-${Date.now().toString().slice(-4)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    success('Audit Ledger Exported', `Downloaded ${filteredEvents.length} signed cryptographic audit logs.`)
  }

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <Shield className="size-3 text-emerald-500" />
              Cryptographic Audit Trail
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              SHA-256 Signed · Tamper-Evident Ledger
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Audit Logs & Security Ledger
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Immutable log of all human interactions, automated self-healing events, IAM policy updates, and cryptographic rotations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-secondary px-4 py-2.5 text-xs font-semibold text-foreground transition-all shadow-sm"
          >
            <Download className="size-4 text-muted-foreground" />
            <span>Export JSON Ledger</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-3">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'Security', label: 'Security & IAM' },
            { id: 'Infrastructure', label: 'Infrastructure' },
            { id: 'Policy', label: 'Policies' },
            { id: 'AI', label: 'Autonomous AI' },
          ].map((tab) => {
            const isSelected = categoryFilter === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCategoryFilter(tab.id as any)
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition select-none shrink-0 ${
                  isSelected
                    ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 border border-cyan-500/40 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search filter */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search by event, actor, IP, hash..."
            className="w-full rounded-xl border border-border bg-card/80 pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* 3. Paginated Audit Table with Shimmer Skeleton */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : paginatedEvents.length > 0 ? (
        <div className="nexus-glass-card rounded-2xl overflow-hidden border border-border shadow-xl">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3.5 bg-secondary/50 border-b border-border text-[11px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">
            <div className="col-span-2">LOG ID & HASH</div>
            <div className="col-span-4">EVENT DESCRIPTION & SCOPE</div>
            <div className="col-span-3">ACTOR / PRINCIPAL</div>
            <div className="col-span-2">NODE & IP</div>
            <div className="col-span-1 text-right">ACTION</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-border/60">
            <AnimatePresence mode="popLayout">
              {paginatedEvents.map((item) => {
                const statusTone =
                  item.status === 'Approved' || item.status === 'Success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : item.status === 'Audited'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="p-4 sm:p-5 lg:grid lg:grid-cols-12 gap-4 items-center hover:bg-secondary/30 transition-colors group"
                  >
                    {/* Log ID & Hash */}
                    <div className="col-span-2 space-y-1 mb-2 lg:mb-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                          #{item.id}
                        </span>
                        <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded border font-semibold ${statusTone}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground truncate">
                        SHA256:{item.sha256.slice(0, 10)}...
                      </div>
                    </div>

                    {/* Event Description */}
                    <div className="col-span-4 min-w-0 mb-2 lg:mb-0">
                      <div className="text-xs sm:text-sm font-semibold text-foreground truncate">
                        {item.event}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[10px] text-muted-foreground uppercase px-1.5 py-0.2 rounded bg-secondary">
                          {item.category}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {item.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* Actor */}
                    <div className="col-span-3 min-w-0 mb-2 lg:mb-0">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-secondary border border-border flex items-center justify-center font-mono text-[9px] font-bold shrink-0 text-foreground">
                          {item.actor.isDaemon ? '⚡' : item.actor.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-foreground truncate">
                            {item.actor.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono truncate">
                            {item.actor.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Node & IP */}
                    <div className="col-span-2 font-mono text-xs mb-2 lg:mb-0">
                      <div className="text-muted-foreground text-[11px] truncate">
                        {item.node}
                      </div>
                      <div className="text-[10px] text-muted-foreground/80">
                        {item.sourceIp}
                      </div>
                    </div>

                    {/* Inspect Action */}
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => setInspectEvent(item)}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-secondary px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-cyan-500/40 transition shadow-sm"
                        title="Inspect cryptographic event payload"
                      >
                        <Eye className="size-3 text-cyan-500" />
                        <span>View</span>
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-secondary/30 border-t border-border/80 text-xs text-muted-foreground font-mono">
            <div>
              Showing Page <span className="text-foreground font-bold">{currentPage}</span> of{' '}
              <span className="text-foreground font-bold">{totalPages}</span> ({filteredEvents.length} logs)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none transition"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-3.5" />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`size-7 rounded-lg text-xs font-semibold transition ${
                    currentPage === i + 1
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none transition"
                aria-label="Next page"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Lock}
          badgeTone="emerald"
          badgeText="AUDIT: NO EVENTS"
          title="No Logs in Selected View"
          description="Zero security or administrative audit records matched your current query criteria."
          action={{
            label: 'Clear Search & Filters',
            icon: RotateCcw,
            onClick: () => {
              setSearchQuery('')
              setCategoryFilter('all')
              setCurrentPage(1)
            },
          }}
        />
      )}

      {/* 4. Event Metadata Inspection Drawer / Modal */}
      <AnimatePresence>
        {inspectEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectEvent(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-popover/95 p-6 shadow-2xl backdrop-blur-2xl z-10 select-none text-foreground"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                    <Code2 className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Audit Record Payload #{inspectEvent.id}
                    </h3>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      SHA256: {inspectEvent.sha256}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setInspectEvent(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* JSON Metadata Payload viewer */}
              <div className="mt-4 space-y-3">
                <div className="text-xs font-semibold text-foreground">
                  {inspectEvent.event}
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-border bg-secondary/40 font-mono text-xs">
                  <div>
                    <span className="text-muted-foreground">Principal: </span>
                    <span className="text-foreground">{inspectEvent.actor.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Source Node: </span>
                    <span className="text-foreground">{inspectEvent.node}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Client IP: </span>
                    <span className="text-foreground">{inspectEvent.sourceIp}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Recorded: </span>
                    <span className="text-foreground">{inspectEvent.timestamp}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Decrypted Event Metadata Payload
                  </label>
                  <pre className="p-3.5 rounded-xl border border-border bg-black/40 font-mono text-[11px] text-cyan-400 overflow-x-auto">
                    {JSON.stringify(inspectEvent.metadata, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setInspectEvent(null)}
                  className="rounded-xl border border-border bg-secondary/60 px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition"
                >
                  Close Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
