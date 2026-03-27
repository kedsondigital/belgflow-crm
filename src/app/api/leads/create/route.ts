import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user) {
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
      linkedin,
      facebook,
      instagram,
      nome_dono,
      email_dono,
    } = body

    if (!pipeline_id || !stage_id || !title) {
      return NextResponse.json(
        { error: 'pipeline_id, stage_id e title são obrigatórios' },
        { status: 400 }
      )
    }

    const lead = await prisma.lead.create({
      data: {
        pipelineId: pipeline_id,
        stageId: stage_id,
        title: String(title).trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        phoneCountryCode: phone?.trim() ? phone_country_code || '32' : null,
        whatsapp: whatsapp || null,
        resumo: resumo?.trim() || null,
        nacionalidade: nacionalidade && nacionalidade !== '__none__' ? nacionalidade : null,
        valor: valor != null && String(valor).trim() !== '' ? String(valor) : null,
        source: source || 'manual',
        position: typeof position === 'number' ? position : 0,
        linkedin: linkedin?.trim() || null,
        facebook: facebook?.trim() || null,
        instagram: instagram?.trim() || null,
        nomeDono: nome_dono?.trim() || null,
        emailDono: email_dono?.trim() || null,
      },
    })

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'created',
        payload: {},
      },
    })

    return NextResponse.json({ lead })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao criar lead' },
      { status: 500 }
    )
  }
}
