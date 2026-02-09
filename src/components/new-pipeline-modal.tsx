'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { toast } from 'sonner'

interface NewPipelineModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (pipelineId: string) => void
}

export function NewPipelineModal({
  open,
  onOpenChange,
  onCreated,
}: NewPipelineModalProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data: pipeline, error: pipelineError } = await supabase
        .from('pipelines')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (pipelineError) throw pipelineError

      const { error: membersError } = await supabase
        .from('pipeline_members')
        .insert({
          pipeline_id: pipeline.id,
          user_id: user.id,
          role_in_pipeline: 'admin',
        })

      if (membersError) throw membersError

      const defaultStages = [
        { name: 'Entrada', position: 0 },
        { name: 'Qualificação', position: 1 },
        { name: 'Proposta', position: 2 },
        { name: 'Negociação', position: 3 },
        { name: 'Fechado', position: 4 },
      ]

      const { error: stagesError } = await supabase.from('stages').insert(
        defaultStages.map((s) => ({
          pipeline_id: pipeline.id,
          name: s.name,
          position: s.position,
        }))
      )

      if (stagesError) throw stagesError

      setName('')
      setDescription('')
      onOpenChange(false)
      toast.success('Pipeline criado com sucesso!')

      if (onCreated) {
        onCreated(pipeline.id)
      } else {
        router.push(`/pipelines/${pipeline.id}`)
        router.refresh()
      }
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: string }).message)
          : error instanceof Error
            ? error.message
            : 'Erro ao criar pipeline'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Pipeline</DialogTitle>
          <DialogDescription>
            Crie um novo pipeline com estágios padrão (Entrada, Qualificação, Proposta, Negociação, Fechado)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pipeline-name">Nome do pipeline *</Label>
            <Input
              id="pipeline-name"
              placeholder="Ex: Vendas 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="pipeline-desc">Descrição (opcional)</Label>
            <Input
              id="pipeline-desc"
              placeholder="Breve descrição do pipeline"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Criando...' : 'Criar pipeline'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
