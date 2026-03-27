import dynamic from 'next/dynamic'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'

const TasksList = dynamic(
  () => import('@/components/tasks-list').then((m) => m.TasksList),
  {
    loading: () => (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    ),
    ssr: true,
  }
)

export default async function TasksPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const tasks = await prisma.task.findMany({
    where: {
      OR: [{ assignedTo: session.user.id }, { assignedTo: null }],
    },
    include: {
      lead: { select: { title: true } },
      assignee: { select: { name: true, email: true } },
    },
    orderBy: { dueDate: 'asc' },
  })

  const tasksData = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    due_date: t.dueDate?.toISOString() || null,
    status: t.status,
    lead_id: t.leadId,
    assigned_to: t.assignedTo,
    leads: { title: t.lead.title },
    profiles: t.assignee ? { name: t.assignee.name || '', email: t.assignee.email } : null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Minhas Tarefas</h1>
        <p className="text-muted-foreground">
          Tarefas atribuídas a você ou sem responsável
        </p>
      </div>
      <TasksList tasks={tasksData} />
    </div>
  )
}
