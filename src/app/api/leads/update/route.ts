import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** Atualiza lead - fallback sem colunas extras se schema antigo */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...fields } = body

    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
    }

    const fullPayload: Record<string, unknown> = {
      title: fields.title,
      email: fields.email || null,
      phone: fields.phone || null,
      phone_country_code: fields.phone ? (fields.phone_country_code || '32') : null,
      whatsapp: fields.whatsapp || null,
      website: fields.website || null,
      source: fields.source || 'manual',
      notes: fields.notes || null,
      assignee_user_id: fields.assignee_user_id && fields.assignee_user_id !== '__none__' ? fields.assignee_user_id : null,
      resumo: fields.resumo || null,
      nacionalidade: fields.nacionalidade && fields.nacionalidade !== '__none__' ? fields.nacionalidade : null,
      valor: fields.valor != null && !Number.isNaN(Number(fields.valor)) ? Number(fields.valor) : null,
    }

    const { error } = await supabase
      .from('leads')
      .update(fullPayload)
      .eq('id', id)

    if (error) {
      const msg = String(error.message || '')
      if (msg.includes('nacionalidade') || msg.includes('schema cache') || msg.includes('column')) {
        const basePayload = {
          title: fields.title,
          email: fields.email || null,
          phone: fields.phone || null,
          whatsapp: fields.whatsapp || null,
          website: fields.website || null,
          source: fields.source || 'manual',
          notes: fields.notes || null,
          assignee_user_id: fields.assignee_user_id && fields.assignee_user_id !== '__none__' ? fields.assignee_user_id : null,
        }
        const { error: fallbackError } = await supabase
          .from('leads')
          .update(basePayload)
          .eq('id', id)

        if (fallbackError) {
          return NextResponse.json({ error: fallbackError.message }, { status: 400 })
        }
        return NextResponse.json({ ok: true })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao atualizar lead' },
      { status: 500 }
    )
  }
}
