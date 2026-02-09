import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const url = new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
  return NextResponse.redirect(url)
}
