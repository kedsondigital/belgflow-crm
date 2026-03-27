import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Logout is now handled by NextAuth's signOut - redirect to API
export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/api/auth/signout`)
}
