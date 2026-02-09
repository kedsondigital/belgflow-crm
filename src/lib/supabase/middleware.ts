import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórios em .env.local')
    return NextResponse.next({ request })
  }

  const supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname
    const isLoginPage = path === '/login' || path === '/auth/callback' || path.startsWith('/auth/')
    const isApiRoute = path.startsWith('/api/')

    if (isApiRoute) {
      return supabaseResponse
    }

    if (!user && !isLoginPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', path)
      return NextResponse.redirect(url)
    }

    if (user && isLoginPage && path === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/pipelines'
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.error('Middleware Supabase error:', error)
  }

  return supabaseResponse
}
