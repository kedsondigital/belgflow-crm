import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    await prisma.leadTag.create({
      data: { leadId: body.lead_id, tag: body.tag },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Tag já existe ou erro ao adicionar' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const leadId = request.nextUrl.searchParams.get('lead_id')
  const tag = request.nextUrl.searchParams.get('tag')

  if (!leadId || !tag) {
    return NextResponse.json({ error: 'lead_id e tag são obrigatórios' }, { status: 400 })
  }

  try {
    await prisma.leadTag.deleteMany({ where: { leadId, tag } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao remover tag' }, { status: 500 })
  }
}
