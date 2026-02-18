'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NewPipelineModal } from '@/components/new-pipeline-modal'
import { AddLeadModal } from '@/components/add-lead-modal'

interface Member {
  id: string
  name: string
  email: string
}

interface PipelineHeaderProps {
  pipelines: { id: string; name: string }[]
  currentPipelineId: string
  stages?: { id: string; name: string; position: number; leads?: unknown[] }[]
  onLeadAdded?: () => void
  members?: Member[]
  assigneeFilter?: string
  onAssigneeFilterChange?: (value: string) => void
  isAdmin?: boolean
}

export function PipelineHeader({
  pipelines,
  currentPipelineId,
  stages = [],
  onLeadAdded,
  members = [],
  assigneeFilter = '__all__',
  onAssigneeFilterChange,
  isAdmin = false,
}: PipelineHeaderProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [addLeadOpen, setAddLeadOpen] = useState(false)

  const handleCreated = (pipelineId: string) => {
    router.push(`/pipelines/${pipelineId}`)
    router.refresh()
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select
          value={currentPipelineId}
          onValueChange={(id) => router.push(`/pipelines/${id}`)}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Selecione o pipeline" />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 size-4" />
            Novo pipeline
          </Button>
        )}
        {stages.length > 0 && (
          <Button size="sm" onClick={() => setAddLeadOpen(true)}>
            <Plus className="mr-2 size-4" />
            Adicionar lead
          </Button>
        )}
        {onAssigneeFilterChange && (
          <Select value={assigneeFilter} onValueChange={onAssigneeFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              <SelectItem value="__unassigned__">Não atribuídos</SelectItem>
              {members
                .filter((m) => m.name || m.email)
                .map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name || m.email}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <AddLeadModal
        open={addLeadOpen}
        onOpenChange={setAddLeadOpen}
        pipelineId={currentPipelineId}
        stages={stages}
        onLeadCreated={() => {
          onLeadAdded?.()
          router.refresh()
        }}
      />

      <NewPipelineModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={handleCreated}
      />
    </>
  )
}
