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

    const pipeline = await prisma.pipeline.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        createdById: session.user.id,
      },
    })

    // Add creator and all admins as members
    const admins = await prisma.user.findMany({
      where: { roleGlobal: 'ADMIN' },
      select: { id: true },
    })

    const memberIds = new Set<string>()
    memberIds.add(session.user.id)
    admins.forEach((a) => memberIds.add(a.id))

    await prisma.pipelineMember.createMany({
      data: Array.from(memberIds).map((userId) => ({
        pipelineId: pipeline.id,
        userId,
        roleInPipeline: 'admin' as const,
      })),
    })

    // Create default stages
    const defaultStages = [
      { name: 'Entrada', position: 0 },
      { name: 'Qualificação', position: 1 },
      { name: 'Proposta', position: 2 },
      { name: 'Negociação', position: 3 },
      { name: 'Fechado', position: 4 },
    ]

    await prisma.stage.createMany({
      data: defaultStages.map((s) => ({
        pipelineId: pipeline.id,
        name: s.name,
        position: s.position,
      })),
    })

    return NextResponse.json({ id: pipeline.id })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao criar pipeline' },
      { status: 500 }
    )
  }
}
