import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { id } = await params
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { tags: { select: { tag: true } } },
  })

  if (!lead) {
    return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
  }

  // Map to match the format components expect
  return NextResponse.json({
    ...lead,
    pipeline_id: lead.pipelineId,
    stage_id: lead.stageId,
    assignee_user_id: lead.assigneeUserId,
    phone_country_code: lead.phoneCountryCode,
    nome_dono: lead.nomeDono,
    email_dono: lead.emailDono,
    created_at: lead.createdAt.toISOString(),
    updated_at: lead.updatedAt.toISOString(),
    lead_tags: lead.tags.map((t) => ({ tag: t.tag })),
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  try {
    await prisma.lead.update({
      where: { id },
      data: body,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao atualizar' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { id } = await params

  try {
    await prisma.lead.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao excluir' },
      { status: 500 }
    )
  }
}
