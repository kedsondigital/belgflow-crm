import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const leadId = request.nextUrl.searchParams.get('lead_id')
  if (!leadId) {
    return NextResponse.json({ error: 'lead_id é obrigatório' }, { status: 400 })
  }

  const activities = await prisma.leadActivity.findMany({
    where: { leadId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(
    activities.map((a) => ({
      ...a,
      lead_id: a.leadId,
      created_at: a.createdAt.toISOString(),
      created_by: a.createdBy,
    }))
  )
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    await prisma.leadActivity.create({
      data: {
        leadId: body.lead_id,
        type: body.type,
        payload: body.payload || {},
        createdBy: session.user.id,
      },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro' },
      { status: 500 }
    )
  }
}
