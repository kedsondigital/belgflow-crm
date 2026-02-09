'use client'

import { useState } from 'react'
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

interface AddTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string
  onTaskCreated: () => void
  members: { id: string; name: string; email: string }[]
}

export function AddTaskModal({
  open,
  onOpenChange,
  leadId,
  onTaskCreated,
  members,
}: AddTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('__none__')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Título é obrigatório')
      return
    }
    setLoading(true)
    try {
      const { error } = await createClient()
        .from('tasks')
        .insert({
          lead_id: leadId,
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          assigned_to: assignedTo && assignedTo !== '__none__' ? assignedTo : null,
          status: 'pending',
        })

      if (error) throw error

      setTitle('')
      setDescription('')
      setDueDate('')
      setAssignedTo('__none__')
      onOpenChange(false)
      onTaskCreated()
      toast.success('Tarefa adicionada!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar tarefa')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setDueDate('')
    setAssignedTo('__none__')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova tarefa</DialogTitle>
          <DialogDescription>Adicionar tarefa ao lead</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="task-title">Título *</Label>
            <Input
              id="task-title"
              placeholder="Ex: Ligar para o cliente"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="task-desc">Descrição</Label>
            <textarea
              id="task-desc"
              className="w-full min-h-[60px] rounded-md border px-3 py-2 text-sm"
              placeholder="Detalhes da tarefa..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="task-due">Data de vencimento</Label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={loading}
            />
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
              {loading ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
