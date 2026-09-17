import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignore Next.js internals, static assets, and ALL API endpoints (so background data fetching works)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get('nexus_session')?.value

  // Login page logic
  if (pathname === '/login') {
    if (sessionCookie) {
      try {
        const user = JSON.parse(sessionCookie)
        if (user && user.status === 'activo') {
          return NextResponse.redirect(new URL('/kanban', request.url))
        }
      } catch {
        // Corrupted session, let stay on login
      }
    }
    return NextResponse.next()
  }

  // If visiting root '/', redirect to /kanban if logged in, or /login if not
  if (pathname === '/') {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.redirect(new URL('/kanban', request.url))
  }

  // All other pages require an active session
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const user = JSON.parse(sessionCookie)

    // Check account status
    if (user.status === 'inactivo' || user.status === 'inactive') {
      const loginUrl = new URL('/login', request.url)
      const res = NextResponse.redirect(loginUrl)
      res.cookies.delete('nexus_session')
      return res
    }

    // Role-based restrictions:
    // 'ti' has access to all modules.
    // 'usuario' only has access to /kanban, /tickets/new, /incidents
    const roleLower = (user.role || '').toLowerCase()
    const isTI =
      roleLower === 'ti' ||
      roleLower.includes('ti') ||
      roleLower.includes('admin') ||
      roleLower.includes('lead') ||
      roleLower.includes('soporte')

    if (!isTI) {
      const isAllowed =
        pathname === '/kanban' ||
        pathname.startsWith('/tickets') ||
        pathname.startsWith('/incidents')

      if (!isAllowed) {
        // Redirect unauthorized user back to their kanban board
        return NextResponse.redirect(new URL('/kanban', request.url))
      }
    }
  } catch (err) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
