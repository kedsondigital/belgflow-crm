import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

  const body = await request.json()
  const { email, name, password } = body

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: email.trim() },
    })

    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 })
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 12)
      : await bcrypt.hash(Math.random().toString(36).slice(-12), 12)

    const newUser = await prisma.user.create({
      data: {
        email: email.trim(),
        name: name?.trim() || null,
        password: hashedPassword,
        roleGlobal: 'MEMBER',
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao criar usuário' },
      { status: 500 }
    )
  }
}
