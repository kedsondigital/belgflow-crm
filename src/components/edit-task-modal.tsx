'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em progresso' },
  { value: 'completed', label: 'Concluída' },
  { value: 'cancelled', label: 'Cancelada' },
]

interface EditTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: {
    id: string
    title: string
    description: string | null
    due_date: string | null
    status: string
    assigned_to: string | null
  } | null
  onTaskUpdated: () => void
  members: { id: string; name: string; email: string }[]
}

export function EditTaskModal({
  open,
  onOpenChange,
  task,
  onTaskUpdated,
  members,
}: EditTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState('pending')
  const [assignedTo, setAssignedTo] = useState('__none__')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setDueDate(task.due_date ? task.due_date.slice(0, 10) : '')
      setStatus(task.status)
      setAssignedTo(task.assigned_to || '__none__')
    }
  }, [task, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task || !title.trim()) {
      toast.error('Título é obrigatório')
      return
    }
    setLoading(true)
    try {
      const { error } = await createClient()
        .from('tasks')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          status,
          assigned_to: assignedTo && assignedTo !== '__none__' ? assignedTo : null,
        })
        .eq('id', task.id)

      if (error) throw error

      onOpenChange(false)
      onTaskUpdated()
      toast.success('Tarefa atualizada!')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao atualizar tarefa'))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar tarefa</DialogTitle>
          <DialogDescription>Altere os dados da tarefa</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-task-title">Título *</Label>
            <Input
              id="edit-task-title"
              placeholder="Ex: Ligar para o cliente"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="edit-task-desc">Descrição</Label>
            <textarea
              id="edit-task-desc"
              className="w-full min-h-[60px] rounded-md border px-3 py-2 text-sm"
              placeholder="Detalhes da tarefa..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="edit-task-due">Data de vencimento</Label>
            <Input
              id="edit-task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Atribuir a</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Ninguém" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Ninguém</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name || m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
