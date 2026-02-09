'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/utils'
import { EditTaskModal } from '@/components/edit-task-modal'

interface TasksListProps {
  tasks: Array<{
    id: string
    title: string
    description: string | null
    due_date: string | null
    status: string
    lead_id: string
    assigned_to: string | null
    leads?: { title: string } | { title: string }[] | null
    profiles?: { name: string; email: string } | { name: string; email: string }[] | null
  }>
  members?: { id: string; name: string; email: string }[]
}

export function TasksList({ tasks: initialTasks, members = [] }: TasksListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [tasks, setTasks] = useState(initialTasks)
  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])
  const [editTaskOpen, setEditTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<{
    id: string
    title: string
    description: string | null
    due_date: string | null
    status: string
    assigned_to: string | null
  } | null>(null)

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const newStatus =
      currentStatus === 'completed' ? 'pending' : 'completed'
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)

    if (error) {
      toast.error('Erro ao atualizar tarefa')
    } else {
      toast.success('Tarefa atualizada')
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        )
      )
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'secondary',
    in_progress: 'default',
    completed: 'outline',
    cancelled: 'destructive',
  }

  if (initialTasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhuma tarefa encontrada
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardHeader className="py-3">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={task.status === 'completed'}
                onCheckedChange={() => handleToggleStatus(task.id, task.status)}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium ${
                    task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={statusColors[task.status] as 'secondary' | 'default' | 'outline' | 'destructive'}>
                    {task.status}
                  </Badge>
                  {(() => {
                    const l = Array.isArray(task.leads) ? task.leads[0] : task.leads
                    return l?.title ? (
                      <span className="text-xs text-muted-foreground">
                        Lead: {l.title}
                      </span>
                    ) : null
                  })()}
                  {task.due_date && (
                    <span className="text-xs text-muted-foreground">
                      Prazo: {new Date(task.due_date).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => {
                    setEditingTask({
                      id: task.id,
                      title: task.title,
                      description: task.description || null,
                      due_date: task.due_date || null,
                      status: task.status,
                      assigned_to: task.assigned_to || null,
                    })
                    setEditTaskOpen(true)
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:text-destructive"
                  onClick={async () => {
                    if (!confirm('Excluir esta tarefa?')) return
                    const { error } = await supabase.from('tasks').delete().eq('id', task.id)
                    if (error) toast.error(getErrorMessage(error, 'Erro ao excluir'))
                    else {
                      setTasks((prev) => prev.filter((t) => t.id !== task.id))
                      toast.success('Tarefa excluída')
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
      <EditTaskModal
        open={editTaskOpen}
        onOpenChange={setEditTaskOpen}
        task={editingTask}
        onTaskUpdated={() => {
          router.refresh()
        }}
        members={members}
      />
    </div>
  )
}
