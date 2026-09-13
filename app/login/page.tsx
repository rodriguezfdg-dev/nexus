'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  Shield,
  Key,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sun,
  Moon,
  Globe,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Fingerprint,
  Terminal,
  RefreshCw,
  UserPlus,
  LogIn,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react'
import { useToast } from '@/components/nexus/toast-provider'

type AuthMode = 'login' | 'register' | 'reset'

export default function LoginPage() {
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { success, warning } = useToast()

  const [mode, setMode] = useState<AuthMode>('login')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)

  // Register form state
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regRole, setRegRole] = useState('Usuario')

  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')

  // Reset form state
  const [resetEmail, setResetEmail] = useState('')

  const [mounted, setMounted] = useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = mounted ? (resolvedTheme || theme || 'dark') : 'dark'
  const toggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark')
  }

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'Credenciales inválidas.')
        setLoading(false)
        return
      }

      if (rememberMe) {
        try {
          localStorage.setItem('nexus_user', JSON.stringify(data.user))
        } catch (e) {}
      }

      success('Sesión Iniciada', `Bienvenido al sistema, ${data.user.name}.`)
      router.push('/kanban')
    } catch (err: any) {
      setErrorMessage('Error al conectar con el servidor de autenticación.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }

    if (regPassword.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: regName.trim(),
          email: regEmail.trim(),
          role: regRole,
          password: regPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'Error en el registro.')
        setLoading(false)
        return
      }

      success('Cuenta Creada', `Usuario ${data.user.name} registrado en SQLite correctamente.`)
      // Auto-switch to login with email prefilled
      setLoginEmail(regEmail)
      setLoginPassword(regPassword)
      setMode('login')
    } catch (err: any) {
      setErrorMessage('Error al registrar usuario en la base de datos.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          email: resetEmail.trim(),
        }),
      })

      const data = await res.json()
      setResetSent(true)
      success('Solicitud Enviada', data.message || 'Instrucciones enviadas.')
    } catch (err) {
      setErrorMessage('No se pudo enviar la solicitud de recuperación.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between p-4 sm:p-6 md:p-8 bg-quantum-grid select-none">
      {/* Top Header */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Shield className="size-5" />
            <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#22d3ee]" />
            </span>
          </div>
          <div>
            <div className="font-mono text-sm font-bold tracking-wider text-foreground">
              NEXUS<span className="text-cyan-600 dark:text-cyan-400 font-black">DESK</span>
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Misión & Operaciones TI
            </div>
          </div>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card/80 hover:bg-secondary px-3 text-xs font-medium text-foreground transition shadow-sm backdrop-blur-md"
          title={`Tema: ${currentTheme === 'dark' ? 'Oscuro' : 'Claro'}`}
        >
          {currentTheme === 'dark' ? (
            <Sun className="size-4 text-cyan-400" />
          ) : (
            <Moon className="size-4 text-violet-600" />
          )}
          <span className="font-mono text-[11px] capitalize">{currentTheme === 'dark' ? 'Oscuro' : 'Claro'}</span>
        </button>
      </header>

      {/* Main Auth Card Container */}
      <main className="w-full max-w-md my-auto z-10 py-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="nexus-glass-card rounded-3xl p-6 sm:p-8 border-cyan-500/30 shadow-2xl relative overflow-hidden backdrop-blur-2xl"
        >
          {/* Subtle Top Glow Halo */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-48 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

          {/* Icon Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative flex size-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              {mode === 'login' && <Lock className="size-6" />}
              {mode === 'register' && <UserPlus className="size-6" />}
              {mode === 'reset' && <KeyRound className="size-6" />}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {mode === 'login' && 'Iniciar Sesión'}
              {mode === 'register' && 'Crear Nueva Cuenta'}
              {mode === 'reset' && 'Recuperar Contraseña'}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {mode === 'login' && 'Ingresa a la consola de operaciones y soporte'}
              {mode === 'register' && 'Registra tu usuario en la base de datos local'}
              {mode === 'reset' && 'Restablece tu clave de seguridad'}
            </p>
          </div>

          {/* Mode Selector Tabs (Iniciar Sesión / Registrarse) */}
          <div className="flex rounded-xl bg-secondary/70 p-1 border border-border/80 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setErrorMessage(null)
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LogIn className="size-3.5" />
              <span>Ingresar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setErrorMessage(null)
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="size-3.5" />
              <span>Registrarse</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 font-medium"
            >
              <AlertTriangle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* TAB 1: INICIAR SESIÓN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 size-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="usuario@tu-empresa.com"
                    className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 pl-10 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500 focus:bg-background transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset')
                      setResetEmail(loginEmail)
                      setErrorMessage(null)
                    }}
                    className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    ¿Olvidó la contraseña?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 size-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 pl-10 pr-10 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500 focus:bg-background transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-border text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Recordar sesión</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="quantum-gradient-btn w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold shadow-lg transition-all disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTRARSE */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nombre Completo
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="ej. Juan Pérez"
                    className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 pl-10 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500 focus:bg-background transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Correo Electrónico
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 size-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="tu-correo@empresa.com"
                    className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 pl-10 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500 focus:bg-background transition"
                  />
                </div>
              </div>


              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500 focus:bg-background transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Confirmar
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repetir clave"
                    className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500 focus:bg-background transition font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="quantum-gradient-btn w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold shadow-lg transition-all disabled:opacity-50 mt-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Guardando en SQLite...</span>
                  </>
                ) : (
                  <>
                    <span>Registrar Cuenta</span>
                    <UserPlus className="size-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: RESETEO DE CONTRASEÑA */}
          {mode === 'reset' && (
            <div className="space-y-4">
              {resetSent ? (
                <div className="text-center py-4 space-y-3">
                  <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="size-6" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    Enlace de Restablecimiento Generado
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hemos procesado la solicitud para <span className="font-mono text-cyan-600 dark:text-cyan-400">{resetEmail}</span>. Si la cuenta existe, se autoriza la reconfiguración de la contraseña.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login')
                      setResetSent(false)
                    }}
                    className="w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 py-2.5 text-xs font-bold transition"
                  >
                    Volver a Iniciar Sesión
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Ingresa el correo corporativo vinculado a tu cuenta para restablecer tu clave de acceso:
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Correo Electrónico
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 size-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="usuario@tu-empresa.com"
                        className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 pl-10 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-500 focus:bg-background transition"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login')
                        setErrorMessage(null)
                      }}
                      className="flex-1 rounded-xl border border-border bg-secondary hover:bg-muted py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="quantum-gradient-btn flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold shadow-md transition disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <span>Enviar Enlace</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </motion.div>
      </main>
    </div>
  )
}
