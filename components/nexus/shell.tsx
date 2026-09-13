'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { NexusSidebar } from '@/components/nexus/sidebar'
import { NexusTopBar } from '@/components/nexus/top-bar'
import { PageTransition } from '@/components/nexus/page-transition'
import { Plus, X, CheckCircle2, Server, Shield, User } from 'lucide-react'
import { useNexusData, Priority } from '@/lib/data-context'

export function NexusShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { createIncident } = useNexusData()

  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [ticketTitle, setTicketTitle] = useState('')
  const [ticketPriority, setTicketPriority] = useState<Priority>('High')
  const [ticketService, setTicketService] = useState('Core-API')
  const [ticketEnv, setTicketEnv] = useState<'Production' | 'Staging' | 'Edge'>('Production')
  const [ticketAssignee, setTicketAssignee] = useState('')
  const [ticketCreatedNotice, setTicketCreatedNotice] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Scroll restoration & Back-navigation tracking
  const mainRef = useRef<HTMLElement>(null)
  const scrollMap = useRef<Record<string, number>>({})
  const isBackNavRef = useRef(false)
  const [isBackNav, setIsBackNav] = useState(false)

  // Listen for browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      isBackNavRef.current = true
      setIsBackNav(true)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Handle route change: restore scroll on back, reset scroll on forward link click
  useEffect(() => {
    if (isBackNavRef.current) {
      const savedScroll = scrollMap.current[pathname] || 0
      requestAnimationFrame(() => {
        if (mainRef.current) {
          mainRef.current.scrollTop = savedScroll
        }
        isBackNavRef.current = false
        setIsBackNav(false)
      })
    } else {
      if (mainRef.current) {
        mainRef.current.scrollTop = 0
      }
    }
  }, [pathname])

  const handleScroll = () => {
    if (mainRef.current) {
      scrollMap.current[pathname] = mainRef.current.scrollTop
    }
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketTitle.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const initials = ticketAssignee
        ? ticketAssignee
            .split(' ')
            .map((p) => p[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'OP'

      const newId = await createIncident({
        title: ticketTitle.trim(),
        priority: ticketPriority,
        service: ticketService.trim() || 'Core-Service',
        env: ticketEnv,
        assignee: {
          name: ticketAssignee.trim() || 'Unassigned',
          initials,
          status: 'online',
        },
        slaSecondsTotal: ticketPriority === 'Critical' ? 900 : ticketPriority === 'High' ? 3600 : 14400,
        slaSecondsRemaining: ticketPriority === 'Critical' ? 900 : ticketPriority === 'High' ? 3600 : 14400,
        aiTriaged: false,
        assignedToMe: true,
        tag: ticketService.trim() || 'General',
        createdTime: 'Just now',
      })

      setTicketCreatedNotice(`Incident ${newId} created successfully in SQLite.`)
      setTicketTitle('')
      setTicketAssignee('')
      setTicketModalOpen(false)
      setTimeout(() => setTicketCreatedNotice(null), 5000)
    } catch (err) {
      console.error('Failed to create incident:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Full-screen layout for authentication pages (e.g. /login)
  if (pathname === '/login') {
    return (
      <div className="min-h-screen w-full bg-background text-foreground bg-quantum-grid flex flex-col">
        {children}
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground bg-quantum-grid transition-colors duration-250">
      
      {/* 1. Persistent Collapsible Sidebar */}
      <NexusSidebar />

      {/* Right Column: TopBar + Page Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        
        {/* 2. Top Command Bar */}
        <NexusTopBar onCreateTicket={() => router.push('/tickets/new')} />


        {/* 3. Main Content Area with Natural Scroll Restoration */}
        <main
          ref={mainRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col"
        >
          
          {/* Ticket Creation Toast Banner if triggered */}
          <AnimatePresence>
            {ticketCreatedNotice && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 flex items-center gap-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-700 dark:text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)] backdrop-blur-xl"
              >
                <CheckCircle2 className="size-4 text-cyan-500 shrink-0" />
                <span className="font-mono">{ticketCreatedNotice}</span>
                <button
                  onClick={() => setTicketCreatedNotice(null)}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated Page Content */}
          <PageTransition isBackNav={isBackNav}>
            {children}
          </PageTransition>

        </main>
      </div>

      {/* Create Quantum Ticket Modal */}
      <AnimatePresence>
        {ticketModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTicketModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-cyan-500/40 bg-popover p-6 shadow-2xl backdrop-blur-2xl z-10"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-500">
                    <Plus className="size-4" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">Crear Ticket de Incidente</h3>
                </div>
                <button
                  onClick={() => setTicketModalOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Título / Resumen del Incidente
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                    placeholder="ej. Falla en pasarela de pagos o latencia en base de datos"
                    className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Nivel de Prioridad
                    </label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value as Priority)}
                      className="w-full rounded-lg border border-border bg-secondary/50 px-2.5 py-2 text-xs text-foreground outline-none focus:border-cyan-500"
                    >
                      <option value="Critical">P1 - Crítico (SLA 15m)</option>
                      <option value="High">P2 - Alto (SLA 1h)</option>
                      <option value="Medium">P3 - Medio (SLA 4h)</option>
                      <option value="Low">P4 - Bajo (SLA 24h)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Servicio Afectado
                    </label>
                    <input
                      type="text"
                      required
                      value={ticketService}
                      onChange={(e) => setTicketService(e.target.value)}
                      placeholder="ej. API Principal, Cluster BD"
                      className="w-full rounded-lg border border-border bg-secondary/50 px-2.5 py-2 text-xs text-foreground outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Entorno
                    </label>
                    <select
                      value={ticketEnv}
                      onChange={(e) => setTicketEnv(e.target.value as any)}
                      className="w-full rounded-lg border border-border bg-secondary/50 px-2.5 py-2 text-xs text-foreground outline-none focus:border-cyan-500"
                    >
                      <option value="Production">Producción</option>
                      <option value="Staging">Staging / Pruebas</option>
                      <option value="Edge">Edge</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Responsable Asignado (Opcional)
                    </label>
                    <input
                      type="text"
                      value={ticketAssignee}
                      onChange={(e) => setTicketAssignee(e.target.value)}
                      placeholder="ej. Juan Pérez"
                      className="w-full rounded-lg border border-border bg-secondary/50 px-2.5 py-2 text-xs text-foreground outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setTicketModalOpen(false)}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="quantum-gradient-btn rounded-lg px-4 py-2 text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creando...' : 'Crear Incidente'}
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
