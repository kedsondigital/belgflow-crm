import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...fields } = body

    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
    }

    await prisma.lead.update({
      where: { id },
      data: {
        title: fields.title,
        email: fields.email || null,
        phone: fields.phone || null,
        phoneCountryCode: fields.phone ? (fields.phone_country_code || '32') : null,
        whatsapp: fields.whatsapp || null,
        website: fields.website || null,
        source: fields.source || 'manual',
        notes: fields.notes || null,
        assigneeUserId: fields.assignee_user_id && fields.assignee_user_id !== '__none__' ? fields.assignee_user_id : null,
        resumo: fields.resumo || null,
        nacionalidade: fields.nacionalidade && fields.nacionalidade !== '__none__' ? fields.nacionalidade : null,
        valor: fields.valor != null && String(fields.valor).trim() !== '' ? String(fields.valor) : null,
        linkedin: fields.linkedin || null,
        facebook: fields.facebook || null,
        instagram: fields.instagram || null,
        nomeDono: fields.nome_dono || null,
        emailDono: fields.email_dono || null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao atualizar lead' },
      { status: 500 }
    )
  }
}
