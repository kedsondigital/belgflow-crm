import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const leadId = request.nextUrl.searchParams.get('lead_id')

  const tasks = await prisma.task.findMany({
    where: leadId ? { leadId } : undefined,
    orderBy: { dueDate: 'asc' },
  })

  return NextResponse.json(
    tasks.map((t) => ({
      ...t,
      lead_id: t.leadId,
      due_date: t.dueDate?.toISOString() || null,
      assigned_to: t.assignedTo,
      created_at: t.createdAt.toISOString(),
      updated_at: t.updatedAt.toISOString(),
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
    const task = await prisma.task.create({
      data: {
        leadId: body.lead_id,
        title: body.title,
        description: body.description || null,
        dueDate: body.due_date || null,
        assignedTo: body.assigned_to && body.assigned_to !== '__none__' ? body.assigned_to : null,
        status: body.status || 'pending',
      },
    })

    return NextResponse.json({
      ...task,
      lead_id: task.leadId,
      due_date: task.dueDate?.toISOString() || null,
      assigned_to: task.assignedTo,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao criar tarefa' },
      { status: 500 }
    )
  }
}
