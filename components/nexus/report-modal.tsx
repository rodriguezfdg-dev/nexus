'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Download,
  RotateCcw,
  Sparkles,
  Terminal,
  Clock,
  ShieldCheck,
  Check,
} from 'lucide-react'

export interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  reportTitle?: string
  scope?: string
  simulateErrorDefault?: boolean
}

interface StepItem {
  id: number
  label: string
  detail: string
  durationMs: number
}

const REPORT_STEPS: StepItem[] = [
  {
    id: 1,
    label: 'Gathering incidents & telemetry...',
    detail: 'Indexed 1,420 incident nodes from US-East / EU-West clusters',
    durationMs: 900,
  },
  {
    id: 2,
    label: 'Calculating SLA metrics & MTTR...',
    detail: 'Resolved mean time to recovery: 14.2m · 99.98% SLA target achieved',
    durationMs: 1000,
  },
  {
    id: 3,
    label: 'Aggregating AI diagnostics & triage...',
    detail: 'Extracted 12 automated root cause analyses and runbook executions',
    durationMs: 950,
  },
  {
    id: 4,
    label: 'Compiling PDF document & signing...',
    detail: 'Generating cryptographic SHA-256 hash & vector charts',
    durationMs: 850,
  },
]

export function ReportModal({
  isOpen,
  onClose,
  reportTitle = 'Executive SLA & Incident Post-Mortem',
  scope = 'Cluster US-East-01 · Past 30 Days',
  simulateErrorDefault = false,
}: ReportModalProps) {
  // Modal state: 'idle' | 'running' | 'success' | 'error'
  const [modalState, setModalState] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [progress, setProgress] = useState(0)
  const [estimatedSeconds, setEstimatedSeconds] = useState(3.7)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [simulateError, setSimulateError] = useState(simulateErrorDefault)
  const [isDownloaded, setIsDownloaded] = useState(false)

  // Timer references for cancellation
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Reset or start when opened
  useEffect(() => {
    if (isOpen) {
      startGeneration()
    } else {
      clearAllTimers()
      setModalState('idle')
      setCurrentStepIndex(0)
      setCompletedSteps([])
      setProgress(0)
      setIsDownloaded(false)
    }
    return () => clearAllTimers()
  }, [isOpen])

  const clearAllTimers = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t))
    timeoutsRef.current = []
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const startGeneration = () => {
    clearAllTimers()
    setModalState('running')
    setCurrentStepIndex(0)
    setCompletedSteps([])
    setProgress(5)
    setIsDownloaded(false)

    const totalEstimated = 3.7
    setEstimatedSeconds(totalEstimated)
    setElapsedSeconds(0)

    // Elapsed timer
    const startTime = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      setElapsedSeconds(Number(elapsed.toFixed(1)))
      const remaining = Math.max(0, totalEstimated - elapsed)
      setEstimatedSeconds(Number(remaining.toFixed(1)))
    }, 100)

    // Sequence the steps
    let accumulatedTime = 100

    REPORT_STEPS.forEach((step, index) => {
      // Step activation timer
      const activateTimer = setTimeout(() => {
        // If simulating error and we reached step 2 (calculating SLA metrics), fail!
        if (simulateError && index === 2) {
          clearAllTimers()
          setModalState('error')
          return
        }

        setCurrentStepIndex(index)
        const stepPct = Math.round(((index + 0.3) / REPORT_STEPS.length) * 100)
        setProgress(stepPct)
      }, accumulatedTime)
      timeoutsRef.current.push(activateTimer)

      accumulatedTime += step.durationMs

      // Step completion timer
      const completeTimer = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, index])
        const finishedPct = Math.round(((index + 1) / REPORT_STEPS.length) * 100)
        setProgress(finishedPct)

        // If this is the last step and no error
        if (index === REPORT_STEPS.length - 1 && !simulateError) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setEstimatedSeconds(0)
          setProgress(100)
          setTimeout(() => {
            setModalState('success')
          }, 350)
        }
      }, accumulatedTime - 80)
      timeoutsRef.current.push(completeTimer)
    })
  }

  const handleCancel = () => {
    clearAllTimers()
    onClose()
  }

  const handleRetry = () => {
    startGeneration()
  }

  const handleDownload = () => {
    setIsDownloaded(true)
    // Simulate real browser download behavior
    const element = document.createElement('a')
    const fileContent = `=== NEXUSDESK EXECUTIVE SLA REPORT ===\nGenerated: ${new Date().toISOString()}\nScope: ${scope}\nTarget: 99.98% Compliant\nIntegrity Hash: SHA256-8F92A1B4E7C2`
    const file = new Blob([fileContent], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `nexus-sla-report-${Date.now().toString().slice(-4)}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCancel}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-cyan-500/30 bg-popover/95 shadow-2xl backdrop-blur-2xl z-10 select-none text-card-foreground"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/80 px-5 py-4 bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <FileText className="size-4.5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Report Generation Engine
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                    {scope}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCancel}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition"
              aria-label="Close modal"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-6">
            {/* Title description */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-foreground">{reportTitle}</div>
                <div className="text-[11px] text-muted-foreground">Quantum PDF compilation with cryptographic telemetry logs.</div>
              </div>

              {/* Demo Mode Toggle: Simulate Failure vs Success */}
              <div className="flex items-center gap-2 bg-secondary/60 border border-border px-2.5 py-1 rounded-lg">
                <label
                  htmlFor="simulate-error-toggle"
                  className="font-mono text-[10px] uppercase font-semibold text-muted-foreground cursor-pointer"
                >
                  Simulate Error
                </label>
                <input
                  id="simulate-error-toggle"
                  type="checkbox"
                  checked={simulateError}
                  onChange={(e) => {
                    setSimulateError(e.target.checked)
                    if (modalState === 'error' || modalState === 'success') {
                      startGeneration()
                    }
                  }}
                  className="size-3.5 accent-cyan-500 cursor-pointer rounded"
                />
              </div>
            </div>

            {/* 1. RUNNING PROGRESS STATE */}
            {modalState === 'running' && (
              <div className="space-y-5">
                {/* Monospace Progress Telemetry Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-300 font-semibold">
                      <span className="inline-block size-2 rounded-full bg-cyan-400 animate-ping" />
                      PROCESSING COMPILATION
                    </span>
                    <span className="text-muted-foreground font-bold">{progress}%</span>
                  </div>

                  {/* Progress track with Shimmer Overlay */}
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary border border-border">
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full"
                      initial={{ width: '5%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                    />
                    {/* Shimmer overlay sweep */}
                    <div className="absolute inset-0 animate-shimmer-sweep pointer-events-none opacity-80" />
                  </div>

                  {/* Estimated time & elapsed time in font-mono */}
                  <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground pt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3 text-muted-foreground" />
                      EST. REMAINING: <span className="text-foreground font-semibold">0{estimatedSeconds.toFixed(1)}s</span>
                    </span>
                    <span>
                      ELAPSED: <span className="text-foreground font-semibold">0{elapsedSeconds.toFixed(1)}s</span>
                    </span>
                  </div>
                </div>

                {/* Sequential Console-style Progress List */}
                <div className="space-y-2 rounded-xl border border-border/80 bg-secondary/30 p-3 font-mono text-xs">
                  {REPORT_STEPS.map((step, index) => {
                    const isDone = completedSteps.includes(index)
                    const isActive = currentStepIndex === index && !isDone
                    const isPending = !isDone && !isActive

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-cyan-500/10 border border-cyan-500/30'
                            : isDone
                            ? 'bg-emerald-500/5 text-muted-foreground'
                            : 'opacity-40'
                        }`}
                      >
                        {/* Step Icon */}
                        <div className="mt-0.5 shrink-0">
                          {isDone ? (
                            <CheckCircle2 className="size-4 text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          ) : isActive ? (
                            <Loader2 className="size-4 text-cyan-600 dark:text-cyan-400 animate-spin" />
                          ) : (
                            <div className="size-4 rounded-full border border-border flex items-center justify-center text-[9px]">
                              {step.id}
                            </div>
                          )}
                        </div>

                        {/* Step Details */}
                        <div className="min-w-0 flex-1">
                          <div
                            className={`font-semibold tracking-tight ${
                              isActive
                                ? 'text-cyan-700 dark:text-cyan-300'
                                : isDone
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {step.label}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-normal truncate mt-0.5">
                            {step.detail}
                          </div>
                        </div>

                        {/* Step Status Badge */}
                        <div className="shrink-0 text-[10px]">
                          {isDone ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">DONE</span>
                          ) : isActive ? (
                            <span className="text-cyan-600 dark:text-cyan-400 font-bold">RUNNING</span>
                          ) : (
                            <span className="text-muted-foreground">WAIT</span>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 2. SUCCESS STATE */}
            {modalState === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-4 flex flex-col items-center text-center space-y-4"
              >
                {/* Glowing Emerald Checkmark */}
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="absolute size-20 rounded-full bg-emerald-500/20 blur-xl"
                  />
                  <div className="relative flex size-16 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.35)]">
                    <ShieldCheck className="size-9 stroke-[2]" />
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-bold text-foreground">
                    Report Compiled Successfully
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Cryptographic audit package ready for distribution and archiving.
                  </p>
                </div>

                {/* File Details Monospace Pill */}
                <div className="w-full rounded-xl border border-border/80 bg-secondary/40 p-3 font-mono text-[11px] text-left space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>DOCUMENT:</span>
                    <span className="text-foreground font-semibold">NEXUS-SLA-Q3-AUDIT.PDF</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>FILE SIZE:</span>
                    <span className="text-foreground font-semibold">4.2 MB (Vector Graphics)</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>SECURITY HASH:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-[200px]">
                      SHA256:8F92A1B4E7...
                    </span>
                  </div>
                </div>

                {/* Download Report Bounce-in Button */}
                <motion.button
                  onClick={handleDownload}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [0.8, 1.06, 1], opacity: 1 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full quantum-gradient-btn flex items-center justify-center gap-2.5 rounded-xl py-3 px-4 text-xs font-bold shadow-lg"
                >
                  {isDownloaded ? (
                    <>
                      <Check className="size-4 stroke-[2.5]" />
                      <span>Downloaded Successfully</span>
                    </>
                  ) : (
                    <>
                      <Download className="size-4 stroke-[2.5] animate-bounce" />
                      <span>Download Report (PDF · 4.2 MB)</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}

            {/* 3. ERROR STATE */}
            {modalState === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-4 flex flex-col items-center text-center space-y-4"
              >
                {/* Amber Warning Icon */}
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                    className="absolute size-20 rounded-full bg-amber-500/20 blur-xl"
                  />
                  <div className="relative flex size-16 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)]">
                    <AlertTriangle className="size-8 stroke-[2]" />
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-bold text-foreground">
                    Generation Interrupted
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Telemetry node timeout occurred while computing multi-region SLA compliance metrics.
                  </p>
                </div>

                {/* Error Traceback Monospace Box */}
                <div className="w-full rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 font-mono text-[11px] text-left text-amber-700 dark:text-amber-300">
                  <div className="font-bold">STATUS_CLUSTER_TIMEOUT (0x504)</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Node: us-east-telemetry-04 · Gateway ACK latency exceeded 5000ms threshold.
                  </div>
                </div>

                {/* Retry Button */}
                <div className="flex w-full gap-2 pt-1">
                  <button
                    onClick={handleCancel}
                    className="flex-1 rounded-xl border border-border bg-secondary/60 hover:bg-secondary py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRetry}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 py-2.5 text-xs font-bold transition shadow-sm"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Retry Generation</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Controls */}
          {modalState === 'running' && (
            <div className="flex items-center justify-between border-t border-border/80 px-5 py-3.5 bg-secondary/20">
              <span className="font-mono text-[10px] text-muted-foreground">
                Worker Node #07 active
              </span>
              <button
                onClick={handleCancel}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              >
                Cancel Generation
              </button>
            </div>
          )}

          {modalState === 'success' && (
            <div className="flex items-center justify-between border-t border-border/80 px-5 py-3.5 bg-secondary/20">
              <button
                onClick={handleRetry}
                className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1.5"
              >
                <RotateCcw className="size-3" />
                <span>Re-generate report</span>
              </button>
              <button
                onClick={onClose}
                className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition"
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
