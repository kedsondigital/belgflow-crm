import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { user_id, pipeline_ids, role_in_pipeline } = body

    // Delete all existing memberships
    await prisma.pipelineMember.deleteMany({ where: { userId: user_id } })

    // Create new memberships
    if (pipeline_ids && pipeline_ids.length > 0) {
      await prisma.pipelineMember.createMany({
        data: pipeline_ids.map((pipelineId: string) => ({
          pipelineId,
          userId: user_id,
          roleInPipeline: role_in_pipeline || 'member',
        })),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro' },
      { status: 500 }
    )
  }
}
