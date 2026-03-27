import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(request) {
    const path = request.nextUrl.pathname
    const token = request.nextauth.token

    // Redirect logged-in users away from login page
    if (token && path === '/login') {
      return NextResponse.redirect(new URL('/pipelines', request.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // Allow public paths
        if (
          path === '/login' ||
          path.startsWith('/api/auth') ||
          path.startsWith('/api/n8n')
        ) {
          return true
        }

        // All other paths require authentication
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    '/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
