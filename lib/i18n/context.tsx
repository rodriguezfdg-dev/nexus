'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Locale, translations } from './translations'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  t: typeof translations['en']
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es') // Default to Spanish as requested by user
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('nexus_language') as Locale
      if (saved === 'en' || saved === 'es') {
        setLocaleState(saved)
      } else {
        setLocaleState('es')
        localStorage.setItem('nexus_language', 'es')
      }
    } catch (e) {}
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem('nexus_language', newLocale)
    } catch (e) {}
  }, [])

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next = prev === 'en' ? 'es' : 'en'
      try {
        localStorage.setItem('nexus_language', next)
      } catch (e) {}
      return next
    })
  }, [])

  const currentTranslations = translations[locale] || translations['es']

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        toggleLocale,
        t: currentTranslations,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
