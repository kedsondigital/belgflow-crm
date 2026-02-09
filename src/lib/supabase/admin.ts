import { createClient } from '@supabase/supabase-js'

// Use ONLY in server-side code (Route Handlers, Server Actions).
// NEVER expose this client to the browser - it uses the service role key.
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
