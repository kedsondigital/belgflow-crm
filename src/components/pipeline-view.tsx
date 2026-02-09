'use client'

import { useState, useMemo } from 'react'
import { PipelineHeader } from '@/components/pipeline-header'
import { KanbanBoard } from '@/components/kanban-board'
import type { Lead } from '@/types/database'

interface StageWithLeads {
  id: string
  name: string
  position: number
  pipeline_id: string
  leads: (Lead & {
    lead_tags?: { tag: string }[]
    profiles?: { name: string; email: string } | null
  })[]
}

interface Member {
  id: string
  name: string
  email: string
}

interface PipelineViewProps {
  pipelineId: string
  pipelines: { id: string; name: string }[]
  stagesWithLeads: StageWithLeads[]
  members: Member[]
  description?: string | null
}

export function PipelineView({
  pipelineId,
  pipelines,
  stagesWithLeads,
  members,
  description,
}: PipelineViewProps) {
  const [assigneeFilter, setAssigneeFilter] = useState<string>('__all__')

  const filteredStages = useMemo(() => {
    if (assigneeFilter === '__all__') return stagesWithLeads
    if (assigneeFilter === '__unassigned__') {
      return stagesWithLeads.map((stage) => ({
        ...stage,
        leads: stage.leads.filter((l) => !l.assignee_user_id),
      }))
    }
    return stagesWithLeads.map((stage) => ({
      ...stage,
      leads: stage.leads.filter((l) => l.assignee_user_id === assigneeFilter),
    }))
  }, [assigneeFilter, stagesWithLeads])

  return (
    <>
      <PipelineHeader
        pipelines={pipelines}
        currentPipelineId={pipelineId}
        stages={stagesWithLeads}
        members={members}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
      />
      {description && (
        <p className="text-muted-foreground mb-2 text-sm">{description}</p>
      )}
      <KanbanBoard
        pipelineId={pipelineId}
        stages={filteredStages}
        members={members}
      />
    </>
  )
}
