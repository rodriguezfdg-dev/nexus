'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getIncidentById,
  IncidentDetail,
  IncidentStatus,
  macroTemplates,
  TimelineEvent,
  Priority
} from '@/lib/mock-incidents'
import {
  ArrowLeft,
  Clock,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Terminal,
  FileUp,
  Code,
  Send,
  Lock,
  MessageSquare,
  Activity,
  RotateCcw,
  Check,
  X,
  Radio,
  ChevronDown,
  Layers,
  Zap,
  Info
} from 'lucide-react'

export default function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const unwrappedParams = use(params)
  const router = useRouter()
  const rawId = unwrappedParams.id || 'NX-8942'

  const [incident, setIncident] = useState<IncidentDetail>(() => getIncidentById(rawId))
  const [currentStatus, setCurrentStatus] = useState<IncidentStatus>(incident.status)
  const [slaRemaining, setSlaRemaining] = useState<number>(incident.slaSecondsRemaining)

  // AI Streaming state
  const [streamingText, setStreamingText] = useState('')
  const [isStreamingDone, setIsStreamingDone] = useState(false)

  // AI Auto-resolve execution console state
  const [isResolving, setIsResolving] = useState(false)
  const [resolveStep, setResolveStep] = useState<number>(-1)
  const [resolveStatus, setResolveStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle')

  // Activity Timeline tabs
  const [timelineTab, setTimelineTab] = useState<'all' | 'internal' | 'customer' | 'system'>('all')

  // Comms editor state
  const [commsMode, setCommsMode] = useState<'internal' | 'customer'>('internal')
  const [editorText, setEditorText] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isMacroOpen, setIsMacroOpen] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null)

  // Synchronize when rawId changes from SQLite or fallback
  useEffect(() => {
    let isMounted = true
    async function fetchFromDb() {
      try {
        const res = await fetch(`/api/incidents/${encodeURIComponent(rawId)}`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted) {
            setIncident(data)
            setCurrentStatus(data.status)
            setSlaRemaining(data.slaSecondsRemaining)
            return
          }
        }
      } catch (e) {
        // Fallback below
      }
      const data = getIncidentById(rawId)
      if (isMounted) {
        setIncident(data)
        setCurrentStatus(data.status)
        setSlaRemaining(data.slaSecondsRemaining)
      }
    }
    fetchFromDb()
    return () => {
      isMounted = false
    }
  }, [rawId])

  // SLA Live Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSlaRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Typewriter streaming effect for AI summary on mount
  useEffect(() => {
    setStreamingText('')
    setIsStreamingDone(false)
    const fullText = incident.aiCopilot.summary
    let index = 0

    const streamInterval = setInterval(() => {
      if (index < fullText.length) {
        setStreamingText(fullText.slice(0, index + 2))
        index += 2
      } else {
        setStreamingText(fullText)
        setIsStreamingDone(true)
        clearInterval(streamInterval)
      }
    }, 12)

    return () => clearInterval(streamInterval)
  }, [incident.aiCopilot.summary])

  // Toast feedback helper
  const showToast = (msg: string) => {
    setFeedbackToast(msg)
    setTimeout(() => setFeedbackToast(null), 3500)
  }

  // Format SLA mm:ss
  const formatSla = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`
  }

  // SLA calculation
  const slaPercentRemaining = Math.max(0, Math.min(100, (slaRemaining / incident.slaSecondsTotal) * 100))
  const slaConsumedPercent = 100 - slaPercentRemaining

  // Execute 1-Click AI Auto-Resolve Sequence
  const runAiAutoResolve = async (simulateFailure = false) => {
    setIsResolving(true)
    setResolveStatus('running')
    setResolveStep(0)

    const steps = incident.aiCopilot.resolutionSteps

    for (let i = 0; i < steps.length; i++) {
      setResolveStep(i)
      // simulate realistic terminal execution delay per step
      await new Promise((r) => setTimeout(r, 900))

      if (simulateFailure && i === 2) {
        setResolveStatus('failed')
        setIsResolving(false)
        showToast('AI Auto-Resolve interrupted: Pod buffer lock conflict')
        return
      }
    }

    setResolveStatus('success')
    setIsResolving(false)
    setCurrentStatus('Resolved')

    // Inject resolution log into timeline
    const resolutionEvent: TimelineEvent = {
      id: `evt-res-${Date.now()}`,
      type: 'system_event',
      author: { name: 'Nexus Quantum Copilot', role: 'Autonomous SRE', initials: 'AI' },
      timestamp: 'Just now',
      content: `AUTONOMOUS REMEDIATION COMPLETE: All ${steps.length} diagnostic and repair steps executed successfully. Service metrics normalized below SLO threshold.`,
      metadata: { logLevel: 'INFO', latency: '14ms', source: 'Nexus-AutoHeal-Worker' }
    }
    setIncident((prev) => ({
      ...prev,
      timeline: [resolutionEvent, ...prev.timeline],
    }))

    showToast('Incident successfully resolved via Quantum AI Auto-Resolve')
  }

  // Insert macro template
  const applyMacro = (macro: typeof macroTemplates[0]) => {
    setEditorText((prev) => (prev ? `${prev}\n\n${macro.content}` : macro.content))
    setCommsMode(macro.type)
    setIsMacroOpen(false)
    showToast(`Injected template: "${macro.title}"`)
  }

  // Insert code snippet
  const insertCodeSnippet = () => {
    const sampleCode = "```sql\n-- Diagnostic lock query:\nSELECT pid, age(clock_timestamp(), query_start), query \nFROM pg_stat_activity \nWHERE state != 'idle';\n```"
    setEditorText((prev) => (prev ? `${prev}\n\n${sampleCode}` : sampleCode))
    showToast('Code block template inserted into editor')
  }

  // Post message to timeline
  const postMessage = () => {
    if (!editorText.trim() && attachedFiles.length === 0) return

    const newEvent: TimelineEvent = {
      id: `evt-user-${Date.now()}`,
      type: commsMode === 'internal' ? 'internal_note' : 'customer_reply',
      author: {
        name: 'Alex Thorne',
        role: commsMode === 'internal' ? 'Staff SRE (You)' : 'Nexus Support Lead',
        initials: 'AT',
        isCustomer: commsMode === 'customer',
      },
      timestamp: 'Just now',
      content: editorText + (attachedFiles.length > 0 ? `\n\n📎 Attached files (${attachedFiles.length}): ${attachedFiles.join(', ')}` : ''),
    }

    setIncident((prev) => ({
      ...prev,
      timeline: [newEvent, ...prev.timeline],
    }))

    setEditorText('')
    setAttachedFiles([])
    showToast(commsMode === 'internal' ? 'Internal note appended to incident timeline' : 'Customer reply dispatched')
  }

  // Close & Resolve Incident manually
  const confirmResolveAndClose = () => {
    setCurrentStatus('Resolved')
    setShowCloseConfirm(false)

    const closeEvent: TimelineEvent = {
      id: `evt-close-${Date.now()}`,
      type: 'system_event',
      author: { name: 'Alex Thorne', role: 'Staff SRE', initials: 'AT' },
      timestamp: 'Just now',
      content: 'INCIDENT MANUALLY RESOLVED: Root cause addressed and service health validated.',
      metadata: { logLevel: 'INFO', source: 'Manual-Resolver' }
    }

    setIncident((prev) => ({
      ...prev,
      timeline: [closeEvent, ...prev.timeline],
    }))

    showToast(`Incident ${incident.id} marked as Resolved`)
  }

  // Filter timeline items based on selected tab
  const filteredTimeline = incident.timeline.filter((event) => {
    if (timelineTab === 'all') return true
    if (timelineTab === 'internal') return event.type === 'internal_note'
    if (timelineTab === 'customer') return event.type === 'customer_reply'
    if (timelineTab === 'system') return event.type === 'system_event'
    return true
  })

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = () => {
    setIsDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files).map((f) => f.name)
    if (droppedFiles.length > 0) {
      setAttachedFiles((prev) => [...prev, ...droppedFiles])
      showToast(`Attached ${droppedFiles.length} file(s) to draft`)
    }
  }

  return (
    <div className="w-full flex flex-col gap-6 pb-16">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {feedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className="fixed top-20 right-8 z-50 flex items-center gap-2.5 rounded-xl border border-cyan-500/40 bg-card/90 px-4 py-3 text-xs text-foreground shadow-2xl backdrop-blur-xl"
          >
            <Check className="size-4 text-cyan-500 shrink-0" />
            <span className="font-mono">{feedbackToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumb & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition shadow-sm"
            title="Return to Incidents list"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back</span>
          </button>

          <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Link
              href="/incidents"
              className="hover:text-cyan-600 dark:hover:text-cyan-400 transition"
            >
              Incidents
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-mono font-bold text-foreground bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-md">
              {incident.id}
            </span>
          </nav>
        </div>

        {/* Status Switcher Pills with Animated Framer Motion LayoutId */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card/70 p-1 backdrop-blur-md shadow-sm">
          {(['Open', 'In Progress', 'Blocked', 'Resolved'] as IncidentStatus[]).map((status) => {
            const isActive = currentStatus === status

            // Status color mappings
            const statusStyles = {
              Open: 'text-amber-600 dark:text-amber-400 border-amber-500/30',
              'In Progress': 'text-cyan-600 dark:text-cyan-300 border-cyan-500/30',
              Blocked: 'text-rose-600 dark:text-rose-400 border-rose-500/30',
              Resolved: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
            }

            return (
              <button
                key={status}
                onClick={() => {
                  setCurrentStatus(status)
                  showToast(`Status shifted to ${status}`)
                }}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                  isActive ? `${statusStyles[status]} font-bold` : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="statusPillBg"
                    className="absolute inset-0 rounded-lg bg-secondary border border-border shadow-sm"
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span
                    className={`size-1.5 rounded-full ${
                      status === 'Open'
                        ? 'bg-amber-500'
                        : status === 'In Progress'
                        ? 'bg-cyan-500 animate-pulse'
                        : status === 'Blocked'
                        ? 'bg-rose-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  {status}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Incident Header Info */}
      <div className="nexus-glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-cyan-600 dark:text-cyan-400">
                {incident.id}
              </span>
              <span
                className={`font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${
                  incident.priority === 'Critical'
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                {incident.priority} Priority
              </span>
              <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-md border border-border bg-secondary text-muted-foreground">
                {incident.service}
              </span>
              <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-md border border-border/70 bg-muted text-muted-foreground">
                Env: {incident.env}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                · Opened {incident.createdTime}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground leading-snug">
              {incident.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              <div>
                Assignee: <strong className="text-foreground font-semibold">{incident.assignee.name}</strong>
              </div>
              <div>
                Reporter: <strong className="text-foreground font-semibold">{incident.reporter.name}</strong> ({incident.reporter.organization})
              </div>
              <div>
                Tag: <strong className="text-foreground font-mono">{incident.tag}</strong>
              </div>
            </div>
          </div>

          {/* SLA Threat Status Badge */}
          <div className="flex flex-col items-start lg:items-end justify-center rounded-xl border border-border bg-secondary/60 p-4 shrink-0 min-w-[200px]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              SLA Expiration Window
            </span>
            <div
              className={`mt-1 font-mono text-2xl font-black ${
                slaRemaining < 900
                  ? 'text-rose-500 dark:text-rose-400 animate-pulse'
                  : 'text-amber-500 dark:text-amber-400'
              }`}
            >
              {formatSla(slaRemaining)}
            </div>
            <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              Target Resolution: 30m 00s
            </span>
          </div>
        </div>

        {/* SLA Progress Bar with Animated Shimmer & Gradient Fill */}
        <div className="mt-6 pt-5 border-t border-border/80">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-3.5 text-cyan-500" />
              <span>SLA Budget Consumed: {slaConsumedPercent.toFixed(1)}%</span>
            </span>
            <span className="text-foreground font-bold">
              {formatSla(slaRemaining)} remaining
            </span>
          </div>

          <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary/80 border border-border">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${slaConsumedPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full relative ${
                slaRemaining < 900
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                  : 'bg-gradient-to-r from-cyan-500 via-violet-500 to-amber-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
              }`}
            >
              {/* Shimmer overlay animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* AI Copilot Widget & RCA Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: AI Copilot Assistant & 1-Click Auto-Resolve (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="nexus-glass-card border-violet-500/30 dark:border-violet-500/20 rounded-2xl p-6 relative overflow-hidden shadow-lg">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    Quantum AI Copilot
                    <span className="font-mono text-[10px] px-2 py-0.2 rounded-full border border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-300 font-normal">
                      v2.4 Core
                    </span>
                  </h2>
                </div>
              </div>

              {/* Confidence Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold">
                <CheckCircle2 className="size-3.5" />
                <span>{incident.aiCopilot.rca.confidencePercent}% Confidence</span>
              </div>
            </div>

            {/* AI Summary Streaming Content */}
            <div className="mt-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                Real-Time Incident Summary
              </span>
              <div className="rounded-xl border border-border/70 bg-secondary/40 p-4 text-xs sm:text-sm text-foreground leading-relaxed font-sans">
                {streamingText}
                {!isStreamingDone && (
                  <span className="inline-block w-1.5 h-3.5 ml-1 bg-cyan-500 animate-pulse" />
                )}
              </div>
            </div>

            {/* RCA Diagnosis Card */}
            <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 text-xs font-bold">
                <Shield className="size-3.5 shrink-0" />
                <span>RCA Root Cause Identified</span>
              </div>
              <p className="text-xs text-foreground/90 leading-normal">
                {incident.aiCopilot.rca.diagnosis}
              </p>
              <div className="text-[11px] text-muted-foreground font-mono pt-1">
                Component: <strong className="text-foreground">{incident.aiCopilot.rca.affectedComponent}</strong>
              </div>
            </div>

            {/* 1-Click AI Auto-Resolve Action Button & Console */}
            <div className="mt-5 pt-4 border-t border-border/80">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-xs font-bold text-foreground">
                    Autonomous Remediation Pipeline
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Execute verified runbook sequence with safety checks.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={isResolving || currentStatus === 'Resolved'}
                    onClick={() => runAiAutoResolve(false)}
                    className="quantum-gradient-btn flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Zap className="size-3.5" />
                    <span>{currentStatus === 'Resolved' ? 'Resolved' : '1-Click AI Auto-Resolve'}</span>
                  </button>

                  <button
                    disabled={isResolving}
                    onClick={() => runAiAutoResolve(true)}
                    className="rounded-xl border border-border bg-secondary/80 px-2.5 py-2 text-[11px] text-muted-foreground hover:text-amber-500 hover:border-amber-500/40 transition"
                    title="Simulate failure & retry flow"
                  >
                    Simulate Failure
                  </button>
                </div>
              </div>

              {/* Console Sequence Drawer */}
              {(isResolving || resolveStatus !== 'idle') && (
                <div className="mt-3 rounded-xl border border-border bg-slate-950 p-4 font-mono text-xs text-slate-200 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="size-3.5 text-cyan-400" />
                      <span>quantum-remediation-runner v2.4</span>
                    </span>
                    <span>
                      {resolveStatus === 'running' && <span className="text-cyan-400 animate-pulse">EXECUTING STEPS...</span>}
                      {resolveStatus === 'success' && <span className="text-emerald-400 font-bold">EXECUTION SUCCESSFUL</span>}
                      {resolveStatus === 'failed' && <span className="text-rose-400 font-bold">REMEDIATION HALTED</span>}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {incident.aiCopilot.resolutionSteps.map((step, idx) => {
                      const isPast = resolveStep > idx || resolveStatus === 'success'
                      const isCurrent = resolveStep === idx && resolveStatus === 'running'
                      const isFailedStep = resolveStatus === 'failed' && resolveStep === idx

                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 text-[11px] ${
                            isPast
                              ? 'text-emerald-400'
                              : isCurrent
                              ? 'text-cyan-300 font-semibold'
                              : isFailedStep
                              ? 'text-rose-400 font-semibold'
                              : 'text-slate-600'
                          }`}
                        >
                          <span className="shrink-0 mt-0.5">
                            {isPast && <CheckCircle2 className="size-3 text-emerald-400" />}
                            {isCurrent && <span className="inline-block size-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />}
                            {isFailedStep && <AlertTriangle className="size-3 text-rose-400" />}
                            {!isPast && !isCurrent && !isFailedStep && <span>○</span>}
                          </span>
                          <span>{step}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* End states banner */}
                  {resolveStatus === 'success' && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-emerald-400 text-xs">
                      <span className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="size-4" />
                        All corrective steps validated · 0 error budgets breached
                      </span>
                    </div>
                  )}

                  {resolveStatus === 'failed' && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-rose-400 text-xs">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="size-4" />
                        Step 3 timed out waiting for connection lock release.
                      </span>
                      <button
                        onClick={() => runAiAutoResolve(false)}
                        className="flex items-center gap-1 rounded bg-rose-500/20 px-2 py-1 text-[10px] text-rose-300 hover:bg-rose-500/30 transition"
                      >
                        <RotateCcw className="size-3" /> Retry Auto-Resolve
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Remediation Steps Checklist & Telemetry (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="nexus-glass-card rounded-2xl p-6 relative">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
              <Layers className="size-4 text-cyan-500" />
              Recommended Human Checklist
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              AI-generated standard operating procedure for this specific failure mode:
            </p>

            <div className="space-y-2.5">
              {incident.aiCopilot.rca.remediationSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-border/80 bg-secondary/40 p-3 text-xs text-foreground hover:border-cyan-500/40 transition"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>

            {/* Quick Macro Insert Box */}
            <div className="mt-5 pt-4 border-t border-border">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">
                Fast Remediation Macro
              </span>
              <button
                onClick={() => applyMacro(macroTemplates[0])}
                className="w-full flex items-center justify-between rounded-xl border border-border bg-card/60 p-3 text-xs text-left hover:border-violet-500/50 hover:bg-violet-500/5 transition"
              >
                <div>
                  <strong className="block text-foreground font-semibold">
                    {macroTemplates[0].title}
                  </strong>
                  <span className="text-[11px] text-muted-foreground">
                    {macroTemplates[0].description}
                  </span>
                </div>
                <Send className="size-3.5 text-violet-500 shrink-0 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline / Comms Feed */}
      <div className="nexus-glass-card rounded-2xl p-6">
        
        {/* Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Activity className="size-4 text-cyan-500" />
              Incident Timeline & Comms Stream
            </h2>
            <p className="text-xs text-muted-foreground">
              Threaded internal engineering notes, customer dialogue, and automated telemetry events.
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 p-1">
            {[
              { id: 'all', label: 'All Activity' },
              { id: 'internal', label: 'Internal Notes' },
              { id: 'customer', label: 'Customer Replies' },
              { id: 'system', label: 'System Logs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTimelineTab(tab.id as typeof timelineTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  timelineTab === tab.id
                    ? 'bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Event Feed */}
        <div className="mt-6 space-y-4">
          {filteredTimeline.map((event) => {
            const isInternal = event.type === 'internal_note'
            const isCustomer = event.type === 'customer_reply'
            const isSystem = event.type === 'system_event'

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl p-4 transition-all duration-200 ${
                  isInternal
                    ? 'border border-violet-500/40 bg-violet-500/5 shadow-[0_0_12px_rgba(139,92,246,0.06)]'
                    : isCustomer
                    ? 'border border-cyan-500/40 bg-cyan-500/5 shadow-[0_0_12px_rgba(6,182,212,0.06)]'
                    : 'border border-border/80 bg-secondary/40 font-mono text-xs'
                }`}
              >
                {/* Event Header */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {/* Author badge / avatar */}
                    <div
                      className={`flex size-6 items-center justify-center rounded-full text-[10px] font-mono font-bold ${
                        isInternal
                          ? 'bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/30'
                          : isCustomer
                          ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      {event.author.initials}
                    </div>

                    <span className="text-xs font-bold text-foreground">
                      {event.author.name}
                    </span>

                    <span className="text-[11px] text-muted-foreground">
                      ({event.author.role})
                    </span>

                    {/* Classification Chip */}
                    {isInternal && (
                      <span className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300 font-semibold">
                        <Lock className="size-2.5" /> Internal Note
                      </span>
                    )}

                    {isCustomer && (
                      <span className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-semibold">
                        <MessageSquare className="size-2.5" /> Customer Visible
                      </span>
                    )}

                    {isSystem && (
                      <span className="font-mono text-[10px] px-2 py-0.2 rounded-full border border-border bg-muted text-muted-foreground">
                        {event.metadata?.logLevel || 'SYSTEM LOG'}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-muted-foreground">
                    {event.timestamp}
                  </span>
                </div>

                {/* Content */}
                <div
                  className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isSystem ? 'font-mono text-xs text-foreground/90 bg-card/60 p-2.5 rounded-lg border border-border/60' : 'text-foreground'
                  }`}
                >
                  {event.content}
                </div>

                {/* System event extra telemetry metadata line */}
                {isSystem && event.metadata && (
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                    {event.metadata.source && <span>Source: <strong>{event.metadata.source}</strong></span>}
                    {event.metadata.latency && <span>Latency: <strong>{event.metadata.latency}</strong></span>}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Bottom Action Bar / Comms Composer */}
      <div className="nexus-glass-card rounded-2xl p-6 border-cyan-500/30 shadow-xl">
        
        {/* Composer Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 mb-3">
          
          {/* Mode Switcher: Internal Note vs Customer Reply */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCommsMode('internal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                commsMode === 'internal'
                  ? 'bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/40 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Lock className="size-3.5" />
              <span>Internal Note</span>
            </button>

            <button
              onClick={() => setCommsMode('customer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                commsMode === 'customer'
                  ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="size-3.5" />
              <span>Customer Reply</span>
            </button>
          </div>

          {/* Quick Helpers: Macro dropdown & Code snippet insert */}
          <div className="flex items-center gap-2 relative">
            
            {/* Macro Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setIsMacroOpen(!isMacroOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/80 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition"
              >
                <span>Macros</span>
                <ChevronDown className="size-3" />
              </button>

              {/* Macro Dropdown Menu */}
              {isMacroOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-72 rounded-xl border border-border bg-card p-2 shadow-2xl z-40 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Insert Macro Template
                  </div>
                  {macroTemplates.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => applyMacro(m)}
                      className="w-full text-left rounded-lg p-2 text-xs hover:bg-secondary transition"
                    >
                      <strong className="block text-foreground font-semibold">{m.title}</strong>
                      <span className="text-[11px] text-muted-foreground line-clamp-1">{m.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Code Snippet Insert */}
            <button
              onClick={insertCodeSnippet}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/80 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition"
              title="Insert formatted code snippet"
            >
              <Code className="size-3.5" />
              <span>Code Snippet</span>
            </button>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={editorText}
          onChange={(e) => setEditorText(e.target.value)}
          placeholder={
            commsMode === 'internal'
              ? 'Add an internal engineering note (visible only to staff)...'
              : 'Draft an official response to the customer / reporter...'
          }
          rows={4}
          className="w-full rounded-xl border border-border bg-card/60 p-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:outline-none transition resize-y font-sans"
        />

        {/* Interactive File Dropzone with Drag-Over Visual Feedback */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mt-3 rounded-xl border-2 border-dashed p-4 text-center transition-all ${
            isDragging
              ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
              : 'border-border/70 hover:border-border bg-secondary/20'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <FileUp className={`size-5 ${isDragging ? 'text-cyan-500 animate-bounce' : 'text-muted-foreground'}`} />
            <span>
              {isDragging ? 'Drop log bundles or core dumps here' : 'Drag & drop crash logs, flamegraphs, or attachments here'}
            </span>
          </div>

          {/* Attached files preview */}
          {attachedFiles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {attachedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 font-mono text-[11px] text-cyan-600 dark:text-cyan-300"
                >
                  <span>{file}</span>
                  <button
                    onClick={() => setAttachedFiles(attachedFiles.filter((_, i) => i !== idx))}
                    className="hover:text-rose-500 ml-1"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Actions Row */}
        <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          
          {/* Resolve & Close Incident Button (with Confirmation Modal Trigger) */}
          <button
            onClick={() => setShowCloseConfirm(true)}
            disabled={currentStatus === 'Resolved'}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50"
          >
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span>{currentStatus === 'Resolved' ? 'Incident Resolved' : 'Resolve & Close Incident'}</span>
          </button>

          {/* Send Message Button */}
          <button
            onClick={postMessage}
            disabled={!editorText.trim() && attachedFiles.length === 0}
            className="quantum-gradient-btn flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold shadow-md disabled:opacity-50"
          >
            <Send className="size-3.5" />
            <span>Post {commsMode === 'internal' ? 'Internal Note' : 'Reply'}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Resolve & Close */}
      <AnimatePresence>
        {showCloseConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="nexus-glass-card rounded-2xl p-6 max-w-md w-full border-emerald-500/40 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-emerald-500">
                <CheckCircle2 className="size-6" />
                <h3 className="text-base font-bold text-foreground">
                  Confirm Incident Resolution
                </h3>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to mark <strong className="text-foreground font-mono">{incident.id}</strong> as <strong className="text-emerald-500">Resolved</strong>?
                This will lock the SLA countdown timer and dispatch resolution telemetry to enterprise monitors.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmResolveAndClose}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition"
                >
                  Confirm & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
