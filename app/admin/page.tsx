'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  Layers,
  Mail,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Key,
  Server,
  Send,
  Loader2,
  RefreshCw,
  Search,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  Sliders,
  Check,
} from 'lucide-react'
import { useNexusData, Section, UserItem } from '@/lib/data-context'
import { useToast } from '@/components/nexus/toast-provider'

type TabType = 'users' | 'sections' | 'email'

export default function AdminControlPanel() {
  const { sections, createSection, deleteSection, refresh } = useNexusData()
  const { success, error, info } = useToast()

  const [activeTab, setActiveTab] = useState<TabType>('users')

  // --- USERS STATE ---
  const [users, setUsers] = useState<UserItem[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState('Soporte TI')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)

  // --- SECTIONS STATE ---
  const [showCreateSectionModal, setShowCreateSectionModal] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [newSectionDesc, setNewSectionDesc] = useState('')
  const [newSectionColor, setNewSectionColor] = useState('cyan')
  const [creatingSection, setCreatingSection] = useState(false)

  // --- EMAIL SETTINGS STATE ---
  const [emailProvider, setEmailProvider] = useState<'gmail' | 'outlook' | 'custom'>('gmail')
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com')
  const [smtpPort, setSmtpPort] = useState(587)
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [senderName, setSenderName] = useState('Nexus Soporte TI')
  const [senderEmail, setSenderEmail] = useState('')
  const [testRecipient, setTestRecipient] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null)

  // Fetch users
  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Fetch email settings
  const fetchEmailSettings = async () => {
    try {
      const res = await fetch('/api/email-settings')
      if (res.ok) {
        const data = await res.json()
        setEmailProvider(data.provider || 'gmail')
        setSmtpHost(data.smtp_host || 'smtp.gmail.com')
        setSmtpPort(data.smtp_port || 587)
        setSmtpUser(data.smtp_user || '')
        setSenderName(data.sender_name || 'Nexus Soporte TI')
        setSenderEmail(data.sender_email || '')
      }
    } catch (err) {
      console.error('Error al cargar configuración de correo:', err)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchEmailSettings()
  }, [])

  // Provider presets handler
  const handleSelectProvider = (prov: 'gmail' | 'outlook' | 'custom') => {
    setEmailProvider(prov)
    if (prov === 'gmail') {
      setSmtpHost('smtp.gmail.com')
      setSmtpPort(587)
    } else if (prov === 'outlook') {
      setSmtpHost('smtp.office365.com')
      setSmtpPort(587)
    }
  }

  // --- CRUD USER HANDLERS ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      error('Campos Requeridos', 'Por favor llena todos los campos del usuario.')
      return
    }

    setCreatingUser(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          role: newUserRole,
          password: newUserPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        error('Error al Crear Usuario', data.error || 'No se pudo guardar el usuario.')
        return
      }

      success('Usuario Creado', `El usuario ${newUserName} fue registrado exitosamente.`)
      setNewUserName('')
      setNewUserEmail('')
      setNewUserPassword('')
      setShowCreateUserModal(false)
      fetchUsers()
      refresh()
    } catch (err: any) {
      error('Error', err.message)
    } finally {
      setCreatingUser(false)
    }
  }

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${name}"?`)) return

    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (res.ok) {
        success('Usuario Eliminado', `El usuario ${name} fue removido del sistema.`)
        setUsers((prev) => prev.filter((u) => u.id !== id))
        refresh()
      } else {
        const data = await res.json()
        error('Error', data.error || 'No se pudo eliminar el usuario.')
      }
    } catch (err: any) {
      error('Error', err.message)
    }
  }

  // --- SECTIONS HANDLERS ---
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSectionName.trim()) {
      error('Campo Requerido', 'Escribe el nombre de la sección.')
      return
    }

    setCreatingSection(true)
    try {
      await createSection({
        name: newSectionName.trim(),
        description: newSectionDesc.trim(),
        color: newSectionColor,
      })
      success('Sección Creada', `La sección "${newSectionName}" fue añadida.`)
      setNewSectionName('')
      setNewSectionDesc('')
      setShowCreateSectionModal(false)
    } catch (err: any) {
      error('Error', err.message)
    } finally {
      setCreatingSection(false)
    }
  }

  const handleDeleteSection = async (id: string, name: string) => {
    if (!confirm(`¿Deseas eliminar la sección "${name}"?`)) return
    try {
      await deleteSection(id)
      success('Sección Eliminada', `La sección "${name}" fue eliminada.`)
    } catch (err: any) {
      error('Error', err.message)
    }
  }

  // --- EMAIL SETTINGS HANDLERS ---
  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingEmail(true)
    try {
      const res = await fetch('/api/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: emailProvider,
          smtp_host: smtpHost,
          smtp_port: smtpPort,
          smtp_user: smtpUser.trim(),
          smtp_pass: smtpPass,
          sender_name: senderName.trim(),
          sender_email: senderEmail.trim() || smtpUser.trim(),
        }),
      })

      const data = await res.json()
      if (res.ok) {
        success('Configuración Guardada', 'Los ajustes de correo se actualizaron correctamente.')
        setSmtpPass('')
      } else {
        error('Error', data.error || 'No se pudo guardar la configuración.')
      }
    } catch (err: any) {
      error('Error', err.message)
    } finally {
      setSavingEmail(false)
    }
  }

  const handleTestEmailConnection = async () => {
    setTestingEmail(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          provider: emailProvider,
          smtp_host: smtpHost,
          smtp_port: smtpPort,
          smtp_user: smtpUser.trim(),
          sender_name: senderName.trim(),
          sender_email: senderEmail.trim() || smtpUser.trim(),
          test_recipient: testRecipient.trim() || smtpUser.trim(),
        }),
      })

      const data = await res.json()
      if (data.success) {
        setTestResult({
          success: true,
          message: data.message,
          details: data.details,
        })
        success('Prueba Exitosa', data.message)
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Fallo en la prueba de conexión SMTP.',
        })
        error('Prueba Fallida', data.error || 'Error de conexión.')
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'No se pudo contactar al servidor de pruebas.',
      })
      error('Error', err.message)
    } finally {
      setTestingEmail(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true
    const q = userSearch.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  })

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="size-4 text-cyan-500" />
            <span className="font-mono text-xs uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-semibold">
              Administración Central
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Panel de Control
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Gestiona los usuarios autorizados, las secciones operativas y el servidor de correo electrónico.
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'users'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="size-4" />
          <span>Gestión de Usuarios (CRUD)</span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'sections'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="size-4" />
          <span>Tipos de Secciones</span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold">
            {sections.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'email'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Mail className="size-4" />
          <span>Servicio de Correos (Gmail / Outlook)</span>
        </button>
      </div>

      {/* TAB 1: USERS CRUD */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs w-full max-w-sm">
              <Search className="size-4 text-muted-foreground" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar usuario por nombre o correo..."
                className="w-full bg-transparent outline-none text-foreground"
              />
            </div>

            <button
              onClick={() => setShowCreateUserModal(true)}
              className="quantum-gradient-btn flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md cursor-pointer"
            >
              <Plus className="size-4 stroke-[2.5]" />
              <span>Crear Nuevo Usuario</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Usuario</th>
                  <th className="p-3.5">Correo Electrónico</th>
                  <th className="p-3.5">Rol en el Sistema</th>
                  <th className="p-3.5">Fecha Registro</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <Loader2 className="size-5 animate-spin mx-auto mb-2 text-cyan-500" />
                      Cargando lista de usuarios...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No se encontraron usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const initials = user.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()

                    return (
                      <tr key={user.id} className="hover:bg-muted/30 transition">
                        <td className="p-3.5 flex items-center gap-2.5">
                          <div className="size-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 shrink-0">
                            {initials}
                          </div>
                          <span className="font-semibold text-foreground">{user.name}</span>
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground">{user.email}</td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-secondary-foreground border border-border">
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3.5 text-muted-foreground font-mono text-[11px]">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SECTIONS */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Define los departamentos o categorías operativas disponibles al momento de crear y filtrar tickets.
            </p>

            <button
              onClick={() => setShowCreateSectionModal(true)}
              className="quantum-gradient-btn flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md cursor-pointer shrink-0"
            >
              <Plus className="size-4 stroke-[2.5]" />
              <span>Crear Sección</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((sec) => {
              const colorClasses: Record<string, string> = {
                blue: 'border-blue-500/40 bg-blue-500/5 text-blue-500',
                emerald: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-500',
                purple: 'border-purple-500/40 bg-purple-500/5 text-purple-500',
                rose: 'border-rose-500/40 bg-rose-500/5 text-rose-500',
                amber: 'border-amber-500/40 bg-amber-500/5 text-amber-500',
                cyan: 'border-cyan-500/40 bg-cyan-500/5 text-cyan-500',
              }
              const cls = colorClasses[sec.color] || colorClasses.cyan

              return (
                <div
                  key={sec.id}
                  className={`rounded-2xl border p-4.5 bg-card relative flex flex-col justify-between shadow-sm transition hover:shadow-md ${cls}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-current" />
                        {sec.name}
                      </h3>
                      <button
                        onClick={() => handleDeleteSection(sec.id, sec.name)}
                        className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition"
                        title="Eliminar sección"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {sec.description || 'Sin descripción específica configurada.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                    <span>ID: {sec.id}</span>
                    <span className="capitalize font-semibold text-foreground">Color: {sec.color}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 3: EMAIL CONFIGURATION */}
      {activeTab === 'email' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Mail className="size-5 text-cyan-500" />
                  <span>Configuración del Proveedor de Correo</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Permite a Nexus despachar notificaciones automáticas y alertas a técnicos y clientes.
                </p>
              </div>

              {/* Provider Selection Cards */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Selecciona el Proveedor de Correo
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Gmail */}
                  <button
                    type="button"
                    onClick={() => handleSelectProvider('gmail')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition cursor-pointer ${
                      emailProvider === 'gmail'
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold shadow-sm'
                        : 'border-border bg-background hover:bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <span className="text-2xl mb-1">🔴</span>
                    <span className="text-xs font-bold">Google Gmail</span>
                    <span className="text-[10px] opacity-75 font-mono">smtp.gmail.com:587</span>
                  </button>

                  {/* Outlook */}
                  <button
                    type="button"
                    onClick={() => handleSelectProvider('outlook')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition cursor-pointer ${
                      emailProvider === 'outlook'
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold shadow-sm'
                        : 'border-border bg-background hover:bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <span className="text-2xl mb-1">🔵</span>
                    <span className="text-xs font-bold">Microsoft Outlook</span>
                    <span className="text-[10px] opacity-75 font-mono">smtp.office365.com:587</span>
                  </button>

                  {/* Custom SMTP */}
                  <button
                    type="button"
                    onClick={() => handleSelectProvider('custom')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition cursor-pointer ${
                      emailProvider === 'custom'
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold shadow-sm'
                        : 'border-border bg-background hover:bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <span className="text-2xl mb-1">⚙️</span>
                    <span className="text-xs font-bold">SMTP Personalizado</span>
                    <span className="text-[10px] opacity-75 font-mono">Servidor propio / Relay</span>
                  </button>
                </div>
              </div>

              {/* Form inputs */}
              <form onSubmit={handleSaveEmailSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Servidor SMTP</label>
                    <input
                      type="text"
                      required
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Puerto</label>
                    <input
                      type="number"
                      required
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(Number(e.target.value))}
                      placeholder="587"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">
                      Usuario / Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="soporte@empresa.com"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground flex items-center justify-between">
                      <span>Contraseña o Contraseña de Aplicación *</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 pr-10 text-xs text-foreground outline-none focus:border-cyan-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 p-1 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Nombre Remitente Visible</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Nexus Soporte TI"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Correo Remitente (From)</label>
                    <input
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="no-reply@nexus.io"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={savingEmail}
                    className="quantum-gradient-btn flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {savingEmail ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    <span>Guardar Configuración</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Test and Instructions Column */}
          <div className="space-y-6">
            {/* Test Connection Card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Send className="size-4 text-cyan-500" />
                <span>Probar Envío de Correo</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Envía un correo de verificación en tiempo real para confirmar que las credenciales y puertos son válidos.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Destinatario de Prueba</label>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="tu-correo@empresa.com"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="button"
                onClick={handleTestEmailConnection}
                disabled={testingEmail}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 py-2.5 text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {testingEmail ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Conectando y enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    <span>Probar Conexión y Enviar</span>
                  </>
                )}
              </button>

              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed animate-in fade-in ${
                    testResult.success
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    {testResult.success ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <AlertCircle className="size-4" />
                    )}
                    <span>{testResult.success ? 'Diagnóstico Exitoso' : 'Error en Conexión'}</span>
                  </div>
                  <p>{testResult.message}</p>
                  {testResult.details && (
                    <div className="mt-2 pt-2 border-t border-emerald-500/20 font-mono text-[10px] space-y-0.5 opacity-90">
                      <div>Servidor: {testResult.details.host}:{testResult.details.port}</div>
                      <div>Cifrado: {testResult.details.security}</div>
                      <div>Latencia: {testResult.details.latency}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Provider Guide */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-5 space-y-3 text-xs text-muted-foreground">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <Lock className="size-3.5 text-amber-500" />
                <span>Instrucciones de Seguridad</span>
              </h4>
              {emailProvider === 'gmail' ? (
                <div className="space-y-2 leading-relaxed">
                  <p>
                    Para <strong>Google Gmail</strong>, debes habilitar la verificación en dos pasos en tu cuenta de Google y generar una <strong>Contraseña de Aplicación</strong> (App Password).
                  </p>
                  <p className="font-mono text-[11px] bg-background/80 p-2 rounded-lg border border-border">
                    Google Account → Seguridad → Contraseñas de aplicaciones
                  </p>
                </div>
              ) : (
                <div className="space-y-2 leading-relaxed">
                  <p>
                    Para <strong>Microsoft Outlook / Office 365</strong>, asegúrate de que el acceso SMTP AUTH esté habilitado en el Centro de Administración de Microsoft 365 para el buzón remitente.
                  </p>
                  <p className="font-mono text-[11px] bg-background/80 p-2 rounded-lg border border-border">
                    Puerto estándar: 587 con cifrado STARTTLS
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Users className="size-4 text-cyan-500" />
                <span>Registrar Nuevo Usuario</span>
              </h3>
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ej: Laura Martínez"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="laura@empresa.com"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Rol / Cargo *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-cyan-500 font-medium"
                >
                  <option value="Soporte TI">Soporte TI (Nivel 1)</option>
                  <option value="DevOps Lead">DevOps Lead / Infraestructura</option>
                  <option value="Operador NOC">Operador NOC / Monitoreo</option>
                  <option value="Administrador">Administrador del Sistema</option>
                  <option value="Seguridad TI">Especialista en Seguridad</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Contraseña Inicial *</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-muted transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="quantum-gradient-btn px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creatingUser && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Guardar Usuario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SECTION MODAL */}
      {showCreateSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Layers className="size-4 text-cyan-500" />
                <span>Crear Tipo de Sección</span>
              </h3>
              <button
                onClick={() => setShowCreateSectionModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSection} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Nombre de la Sección *</label>
                <input
                  type="text"
                  required
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="Ej: Ciberseguridad, Redes, Facturación..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Descripción Operativa</label>
                <textarea
                  rows={3}
                  value={newSectionDesc}
                  onChange={(e) => setNewSectionDesc(e.target.value)}
                  placeholder="Detalla qué tipo de tickets o servicios atiende este departamento..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground outline-none focus:border-cyan-500 resize-none font-normal"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Color Identificador</label>
                <div className="flex items-center gap-3">
                  {[
                    { id: 'cyan', label: 'Cian', class: 'bg-cyan-500' },
                    { id: 'blue', label: 'Azul', class: 'bg-blue-500' },
                    { id: 'emerald', label: 'Verde', class: 'bg-emerald-500' },
                    { id: 'purple', label: 'Morado', class: 'bg-purple-500' },
                    { id: 'rose', label: 'Rosa', class: 'bg-rose-500' },
                    { id: 'amber', label: 'Ámbar', class: 'bg-amber-500' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewSectionColor(c.id)}
                      className={`size-7 rounded-full ${c.class} transition-transform flex items-center justify-center ${
                        newSectionColor === c.id ? 'ring-4 ring-cyan-500/30 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={c.label}
                    >
                      {newSectionColor === c.id && <Check className="size-3 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateSectionModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-muted transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingSection}
                  className="quantum-gradient-btn px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creatingSection && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Crear Sección</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
