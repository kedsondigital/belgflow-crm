import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// No longer needed with NextAuth - redirect to login
export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/login`)
}
