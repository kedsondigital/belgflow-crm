'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { LeadCard } from '@/components/lead-card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AddLeadModal } from '@/components/add-lead-modal'
import { EditStageDialog } from '@/components/edit-stage-dialog'
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

interface KanbanColumnProps {
  stage: StageWithLeads
  onLeadClick: (leadId: string) => void
  onLeadCreated: (lead: Lead) => void
  onLeadDelete?: (leadId: string) => void
  pipelineId: string
  onEditStage?: (stageId: string, name: string) => void
  onDeleteStage?: (stageId: string) => void
  canEditStages?: boolean
}

export function KanbanColumn({
  stage,
  onLeadClick,
  onLeadCreated,
  onLeadDelete,
  pipelineId,
  onEditStage,
  onDeleteStage,
  canEditStages = false,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.id}`,
  })
  const [addLeadOpen, setAddLeadOpen] = useState(false)
  const [editStageOpen, setEditStageOpen] = useState(false)

  return (
    <>
      <div
        ref={setNodeRef}
        className={`flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30 transition-colors ${
          isOver ? 'border-primary/50 bg-muted/50' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-1 border-b p-3">
          <h3 className="truncate font-semibold">{stage.name}</h3>
          <div className="flex shrink-0 items-center gap-1">
            <span className="text-muted-foreground text-sm">
              {stage.leads.length}
            </span>
            {canEditStages && (onEditStage || onDeleteStage) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEditStage && (
                    <DropdownMenuItem onClick={() => setEditStageOpen(true)}>
                      <Pencil className="mr-2 size-4" />
                      Renomear
                    </DropdownMenuItem>
                  )}
                  {onDeleteStage && (
                    <DropdownMenuItem
                      onClick={() => onDeleteStage(stage.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 size-4" />
                      Excluir estágio
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <div className="flex min-h-[200px] flex-1 flex-col overflow-y-auto p-2">
          <SortableContext
            items={stage.leads.map((l) => `lead-${l.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {stage.leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onClick={() => onLeadClick(lead.id)}
                onDelete={onLeadDelete}
              />
            ))}
          </SortableContext>

          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-muted-foreground"
            onClick={() => setAddLeadOpen(true)}
          >
            <Plus className="mr-2 size-4" />
            Adicionar lead
          </Button>
        </div>
      </div>

      <AddLeadModal
        open={addLeadOpen}
        onOpenChange={setAddLeadOpen}
        pipelineId={pipelineId}
        stageId={stage.id}
        stageName={stage.name}
        position={stage.leads.length}
        onLeadCreated={onLeadCreated}
      />

      {onEditStage && (
        <EditStageDialog
          open={editStageOpen}
          onOpenChange={setEditStageOpen}
          stageName={stage.name}
          onSave={async (newName) => {
            await onEditStage(stage.id, newName)
            setEditStageOpen(false)
          }}
        />
      )}
    </>
  )
}
