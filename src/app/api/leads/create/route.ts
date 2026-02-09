import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Cria lead via API - tenta com todos os campos, fallback sem colunas extras se schema antigo */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      pipeline_id,
      stage_id,
      title,
      email,
      phone,
      phone_country_code,
      whatsapp,
      resumo,
      nacionalidade,
      valor,
      source,
      position,
    } = body

    if (!pipeline_id || !stage_id || !title) {
      return NextResponse.json(
        { error: 'pipeline_id, stage_id e title são obrigatórios' },
        { status: 400 }
      )
    }

    const basePayload = {
      pipeline_id,
      stage_id,
      title: String(title).trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      whatsapp: whatsapp || null,
      source: source || 'manual',
      position: typeof position === 'number' ? position : 0,
    }

    const fullPayload = {
      ...basePayload,
      phone_country_code: phone?.trim() ? phone_country_code || '32' : null,
      resumo: resumo?.trim() || null,
      nacionalidade: nacionalidade && nacionalidade !== '__none__' ? nacionalidade : null,
      valor: valor != null && !Number.isNaN(Number(valor)) ? Number(valor) : null,
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .insert(fullPayload)
      .select()
      .single()

    if (error) {
      const msg = String(error.message || '')
      if (msg.includes('nacionalidade') || msg.includes('schema cache') || msg.includes('column')) {
        const { data: fallbackLead, error: fallbackError } = await supabase
          .from('leads')
          .insert(basePayload)
          .select()
          .single()

        if (fallbackError) {
          return NextResponse.json({ error: fallbackError.message }, { status: 400 })
        }

        await supabase.from('lead_activities').insert({
          lead_id: fallbackLead.id,
          type: 'created',
          payload: {},
        })

        return NextResponse.json({ lead: fallbackLead })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await supabase.from('lead_activities').insert({
      lead_id: lead.id,
      type: 'created',
      payload: {},
    })

    return NextResponse.json({ lead })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao criar lead' },
      { status: 500 }
    )
  }
}
