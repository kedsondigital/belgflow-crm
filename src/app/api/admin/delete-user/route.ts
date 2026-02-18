import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verifica se o usuário atual é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role_global')
      .eq('id', user.id)
      .single()

    if (profile?.role_global !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Não permite deletar a si mesmo
    if (userId === user.id) {
      return NextResponse.json({ error: 'Você não pode remover a si mesmo' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Remove o usuário de todos os pipelines
    await adminClient
      .from('pipeline_members')
      .delete()
      .eq('user_id', userId)

    // Remove o perfil do usuário
    await adminClient
      .from('profiles')
      .delete()
      .eq('id', userId)

    // Remove o usuário da autenticação do Supabase
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Erro ao deletar usuário da auth:', authError)
      return NextResponse.json({ error: 'Erro ao remover usuário da autenticação' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
