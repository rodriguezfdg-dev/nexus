import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { NexusShell } from '@/components/nexus/shell'
import { ToastProvider } from '@/components/nexus/toast-provider'
import { LanguageProvider } from '@/lib/i18n/context'
import { DataProvider } from '@/lib/data-context'

export const metadata: Metadata = {
  title: 'NexusDesk — Futuristic IT Operations & Helpdesk Shell',
  description: 'Next-generation IT operations dashboard and incident response workspace.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#030712' },
  ],
  userScalable: false,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground transition-colors duration-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <LanguageProvider>
            <ToastProvider>
              <DataProvider>
                <NexusShell>
                  {children}
                </NexusShell>
              </DataProvider>
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
