import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  if (!currentUser) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role_global')
    .eq('id', currentUser.id)
    .single()

  if (profile?.role_global !== 'ADMIN') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await request.json()
  const { email, name, password } = body

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    const { data: newUser, error } = await admin.auth.admin.createUser({
      email: email.trim(),
      password: password || undefined,
      email_confirm: true,
      user_metadata: { name: name?.trim() || null },
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao criar usuário' },
      { status: 500 }
    )
  }
}
