'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low'
export type IncidentStatus = 'Open' | 'In Progress' | 'Blocked' | 'Resolved'

export interface Assignee {
  name: string
  initials: string
  status: 'online' | 'busy' | 'ai'
}

export interface Reporter {
  name: string
  email: string
  organization: string
}

export interface Incident {
  id: string
  title: string
  priority: Priority
  status: IncidentStatus
  service: string
  env: 'Production' | 'Staging' | 'Edge'
  assignee: Assignee
  reporter: Reporter
  slaSecondsTotal: number
  slaSecondsRemaining: number
  aiTriaged: boolean
  assignedToMe: boolean
  tag: string
  createdTime: string
  aiCopilot?: {
    summary: string
    rca: {
      diagnosis: string
      confidencePercent: number
      affectedComponent: string
      remediationSteps: string[]
    }
    resolutionSteps: string[]
  }
  timeline?: {
    id: string
    type: string
    author: {
      name: string
      role: string
      initials: string
    }
    timestamp: string
    content: string
  }[]
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  tier: string
  status: 'online' | 'busy' | 'offline'
  initials: string
}

export interface Runbook {
  id: string
  title: string
  category: string
  summary: string
  tags: string[]
  reads: string
  lastUpdated: string
  author: {
    name: string
    initials: string
    role: string
  }
  steps: {
    title: string
    description: string
    command?: string
  }[]
}

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

export interface AuditLog {
  id: string
  event: string
  category: string
  actor: {
    name: string
    email: string
    isDaemon?: boolean
  }
  sourceIp: string
  node: string
  status: string
  timestamp: string
  sha256: string
  metadata: Record<string, any>
}

export interface Section {
  id: string
  name: string
  description?: string
  color: string
  created_at?: string
}

export interface UserItem {
  id: string
  name: string
  email: string
  role: string
  created_at?: string
}

interface DataContextType {
  incidents: Incident[]
  sections: Section[]
  usersList: UserItem[]
  teamMembers: TeamMember[]
  runbooks: Runbook[]
  automationRules: AutomationRule[]
  auditLogs: AuditLog[]
  loading: boolean
  refresh: () => Promise<void>
  createIncident: (incident: Partial<Incident>) => Promise<string>
  updateIncident: (id: string, updates: Partial<Incident>) => Promise<void>
  deleteIncident: (id: string) => Promise<void>
  createSection: (section: Partial<Section>) => Promise<void>
  deleteSection: (id: string) => Promise<void>
  createTeamMember: (member: Partial<TeamMember>) => Promise<void>
  deleteTeamMember: (id: string) => Promise<void>
  createRunbook: (runbook: Partial<Runbook>) => Promise<void>
  deleteRunbook: (id: string) => Promise<void>
  createRule: (rule: Partial<AutomationRule>) => Promise<void>
  updateRuleStatus: (id: string, status: 'active' | 'paused') => Promise<void>
  deleteRule: (id: string) => Promise<void>
  clearAllData: () => Promise<void>
  importData: (data: any, wipeExisting?: boolean) => Promise<void>
}


const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [usersList, setUsersList] = useState<UserItem[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [runbooks, setRunbooks] = useState<Runbook[]>([])
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const [incRes, secRes, userRes, teamRes, rbRes, ruleRes, auditRes] = await Promise.all([
        fetch('/api/incidents'),
        fetch('/api/sections'),
        fetch('/api/users'),
        fetch('/api/team'),
        fetch('/api/runbooks'),
        fetch('/api/automation-rules'),
        fetch('/api/audit-logs'),
      ])

      if (incRes.ok) setIncidents(await incRes.json())
      if (secRes.ok) setSections(await secRes.json())
      if (userRes.ok) setUsersList(await userRes.json())
      if (teamRes.ok) setTeamMembers(await teamRes.json())
      if (rbRes.ok) setRunbooks(await rbRes.json())
      if (ruleRes.ok) setAutomationRules(await ruleRes.json())
      if (auditRes.ok) setAuditLogs(await auditRes.json())
    } catch (err) {
      console.error('Failed to load data from SQLite API:', err)
    } finally {
      setLoading(false)
    }
  }, [])


  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Live SLA countdown ticker
  useEffect(() => {
    if (incidents.length === 0) return
    const timer = setInterval(() => {
      setIncidents((prev) =>
        prev.map((inc) => ({
          ...inc,
          slaSecondsRemaining: inc.slaSecondsRemaining > 0 ? inc.slaSecondsRemaining - 1 : 0,
        }))
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [incidents.length])

  const createIncident = async (data: Partial<Incident>) => {
    const res = await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    await fetchAll()
    return result.id
  }

  const updateIncident = async (id: string, updates: Partial<Incident>) => {
    await fetch('/api/incidents', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, ...updates } : inc))
    )
    fetchAll()
  }

  const deleteIncident = async (id: string) => {
    await fetch(`/api/incidents?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    setIncidents((prev) => prev.filter((i) => i.id !== id))
    fetchAll()
  }

  const createTeamMember = async (member: Partial<TeamMember>) => {
    await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    })
    fetchAll()
  }

  const deleteTeamMember = async (id: string) => {
    await fetch(`/api/team?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    fetchAll()
  }

  const createRunbook = async (runbook: Partial<Runbook>) => {
    await fetch('/api/runbooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(runbook),
    })
    fetchAll()
  }

  const deleteRunbook = async (id: string) => {
    await fetch(`/api/runbooks?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    fetchAll()
  }

  const createRule = async (rule: Partial<AutomationRule>) => {
    await fetch('/api/automation-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    })
    fetchAll()
  }

  const updateRuleStatus = async (id: string, status: 'active' | 'paused') => {
    await fetch('/api/automation-rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    fetchAll()
  }

  const deleteRule = async (id: string) => {
    await fetch(`/api/automation-rules?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    fetchAll()
  }

  const createSection = async (section: Partial<Section>) => {
    await fetch('/api/sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(section),
    })
    await fetchAll()
  }

  const deleteSection = async (id: string) => {
    await fetch(`/api/sections?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    await fetchAll()
  }

  const clearAllData = async () => {
    await fetch('/api/migration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear' }),
    })
    await fetchAll()
  }

  const importData = async (data: any, wipeExisting = true) => {
    await fetch('/api/migration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'import', data, wipeExisting }),
    })
    await fetchAll()
  }

  return (
    <DataContext.Provider
      value={{
        incidents,
        sections,
        usersList,
        teamMembers,
        runbooks,
        automationRules,
        auditLogs,
        loading,
        refresh: fetchAll,
        createIncident,
        updateIncident,
        deleteIncident,
        createSection,
        deleteSection,
        createTeamMember,
        deleteTeamMember,
        createRunbook,
        deleteRunbook,
        createRule,
        updateRuleStatus,
        deleteRule,
        clearAllData,
        importData,
      }}
    >
      {children}
    </DataContext.Provider>
  )

}

export function useNexusData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useNexusData must be used within a DataProvider')
  }
  return context
}
