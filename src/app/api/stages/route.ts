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
    const stage = await prisma.stage.create({
      data: {
        pipelineId: body.pipeline_id,
        name: body.name,
        position: body.position,
      },
    })

    return NextResponse.json({
      ...stage,
      pipeline_id: stage.pipelineId,
      created_at: stage.createdAt.toISOString(),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao criar estágio' },
      { status: 500 }
    )
  }
}
