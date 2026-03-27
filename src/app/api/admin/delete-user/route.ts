import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const profile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roleGlobal: true },
    })

    if (profile?.roleGlobal !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Você não pode remover a si mesmo' }, { status: 400 })
    }

    // Remove pipeline memberships, then the user
    await prisma.pipelineMember.deleteMany({ where: { userId } })
    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
