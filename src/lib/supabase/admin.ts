import { createClient } from '@supabase/supabase-js'
import { getEnv } from './env'

// Use ONLY in server-side code (Route Handlers, Server Actions).
// NEVER expose this client to the browser - it uses the service role key.
export function createAdminClient() {
  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')!
  const supabaseServiceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')!

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase env vars for admin client')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
