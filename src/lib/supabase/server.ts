import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const PLACEHOLDERS = ['__NEXT_PUBLIC_SUPABASE_URL__', '__NEXT_PUBLIC_SUPABASE_ANON_KEY__']

function isValidConfig(url: string | undefined, key: string | undefined) {
  if (!url || !key) return false
  return !PLACEHOLDERS.some((p) => url.includes(p) || key.includes(p))
}

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!isValidConfig(supabaseUrl, supabaseAnonKey)) {
    throw new Error(
      'Configuração inválida: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórios em .env.local'
    )
  }

  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  )
}
