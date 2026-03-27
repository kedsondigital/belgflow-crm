import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...data } = body

    const targetId = id || session.user.id

    // Map snake_case to camelCase
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.role_global !== undefined) updateData.roleGlobal = data.role_global
    if (data.is_active !== undefined) updateData.isActive = data.is_active

    await prisma.user.update({
      where: { id: targetId },
      data: updateData,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro' },
      { status: 500 }
    )
  }
}
