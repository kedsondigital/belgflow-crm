import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      description,
      due_date,
      status,
      lead_id,
      assigned_to,
      leads(title),
      profiles:assigned_to(name, email)
    `)
    .or(`assigned_to.eq.${user.id},assigned_to.is.null`)
    .order('due_date', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Minhas Tarefas</h1>
        <p className="text-muted-foreground">
          Tarefas atribuídas a você ou sem responsável
        </p>
      </div>
      <TasksList tasks={tasks || []} />
    </div>
  )
}
