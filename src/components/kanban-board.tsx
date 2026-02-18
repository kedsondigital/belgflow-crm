'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { KanbanColumn } from '@/components/kanban-column'
import { LeadCardPreview } from '@/components/lead-card-preview'
import { LeadDrawer } from '@/components/lead-drawer'
import { AddStageDialog } from '@/components/add-stage-dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
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

interface KanbanBoardProps {
  pipelineId: string
  pipelineName?: string
  stages: StageWithLeads[]
  members: Member[]
  isAdmin?: boolean
}

export function KanbanBoard({
  pipelineId,
  stages: initialStages,
  members,
  isAdmin = false,
}: KanbanBoardProps) {
  const router = useRouter()
  const [stages, setStages] = useState(initialStages)

  useEffect(() => {
    setStages(initialStages)
  }, [initialStages])
  const [selectedLead, setSelectedLead] = useState<string | null>(null)
  const [activeLead, setActiveLead] = useState<(Lead & { lead_tags?: { tag: string }[]; profiles?: { name: string; email: string } | null }) | null>(null)
  const [addStageOpen, setAddStageOpen] = useState(false)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  )

  const updateLeadStage = async (
    leadId: string,
    newStageId: string,
    newPosition: number
  ) => {
    const { error } = await supabase
      .from('leads')
      .update({ stage_id: newStageId, position: newPosition })
      .eq('id', leadId)

    if (error) {
      toast.error('Erro ao mover lead')
      return false
    }

    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      type: 'stage_change',
      payload: { new_stage_id: newStageId },
    })

    return true
  }

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = String(event.active.id)
    if (activeId.startsWith('lead-')) {
      const leadId = activeId.replace('lead-', '')
      for (const stage of stages) {
        const lead = stage.leads.find((l) => l.id === leadId)
        if (lead) {
          setActiveLead(lead)
          break
        }
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveLead(null)
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    if (activeId.startsWith('lead-')) {
      const leadId = activeId.replace('lead-', '')
      const overStageId = overId.startsWith('stage-')
        ? overId.replace('stage-', '')
        : null
      const overLeadId = overId.startsWith('lead-') ? overId.replace('lead-', '') : null

      if (overStageId) {
        setStages((prev) => {
          const newStages = prev.map((s) => ({ ...s, leads: [...s.leads] }))
          const sourceStage = newStages.find((s) =>
            s.leads.some((l) => l.id === leadId)
          )
          const lead = sourceStage?.leads.find((l) => l.id === leadId)
          if (!sourceStage || !lead) return prev

          sourceStage.leads = sourceStage.leads.filter((l) => l.id !== leadId)
          const targetStage = newStages.find((s) => s.id === overStageId)
          if (targetStage) {
            targetStage.leads.push(lead)
          }
          return newStages
        })

        const success = await updateLeadStage(leadId, overStageId, 0)
        if (!success) {
          setStages(initialStages)
        } else {
          toast.success('Lead movido')
        }
      } else if (overLeadId) {
        const targetStage = stages.find((s) =>
          s.leads.some((l) => l.id === overLeadId)
        )
        if (!targetStage) return

        setStages((prev) => {
          const newStages = prev.map((s) => ({ ...s, leads: [...s.leads] }))
          const sourceStage = newStages.find((s) =>
            s.leads.some((l) => l.id === leadId)
          )
          const lead = sourceStage?.leads.find((l) => l.id === leadId)
          if (!sourceStage || !lead) return prev

          sourceStage.leads = sourceStage.leads.filter((l) => l.id !== leadId)
          const newTargetStage = newStages.find((s) => s.id === targetStage.id)
          if (newTargetStage) {
            const targetIdx = newTargetStage.leads.findIndex((l) => l.id === overLeadId)
            newTargetStage.leads.splice(targetIdx + 1, 0, lead)
          }

          return newStages
        })

        const targetIdx = targetStage.leads.findIndex((l) => l.id === overLeadId)
        const success = await updateLeadStage(
          leadId,
          targetStage.id,
          targetIdx + 1
        )
        if (!success) {
          setStages(initialStages)
        } else {
          toast.success('Lead movido')
        }
      }
    }
  }

  const handleLeadCreated = (lead: Lead) => {
    setStages((prev) =>
      prev.map((s) => {
        if (s.id === lead.stage_id) {
          return { ...s, leads: [...s.leads, lead] }
        }
        return s
      })
    )
    setSelectedLead(lead.id)
  }

  const handleLeadUpdated = (close = false) => {
    if (close) setSelectedLead(null)
    router.refresh()
  }

  const handleLeadDeleted = async (leadId: string) => {
    const { error } = await supabase.from('leads').delete().eq('id', leadId)
    if (error) {
      toast.error('Erro ao excluir lead')
      return
    }
    setSelectedLead(null)
    setStages((prev) =>
      prev.map((s) => ({
        ...s,
        leads: s.leads.filter((l) => l.id !== leadId),
      }))
    )
    toast.success('Lead excluído')
    router.refresh()
  }

  const handleEditStage = async (stageId: string, newName: string) => {
    const { error } = await supabase
      .from('stages')
      .update({ name: newName })
      .eq('id', stageId)
    if (error) {
      toast.error('Erro ao renomear estágio')
      throw error
    }
    setStages((prev) =>
      prev.map((s) => (s.id === stageId ? { ...s, name: newName } : s))
    )
    toast.success('Estágio renomeado')
  }

  const handleDeleteStage = async (stageId: string) => {
    const stage = stages.find((s) => s.id === stageId)
    if (!stage) return
    if (stage.leads.length > 0) {
      toast.error('Mova os leads para outro estágio antes de excluir')
      return
    }
    if (stages.length <= 1) {
      toast.error('O pipeline precisa ter pelo menos um estágio')
      return
    }
    const { error } = await supabase.from('stages').delete().eq('id', stageId)
    if (error) {
      toast.error('Erro ao excluir estágio')
      return
    }
    setStages((prev) => prev.filter((s) => s.id !== stageId))
    toast.success('Estágio excluído')
  }

  const handleAddStage = async (name: string) => {
    const maxPos = Math.max(...stages.map((s) => s.position), -1)
    const { data: newStage, error } = await supabase
      .from('stages')
      .insert({
        pipeline_id: pipelineId,
        name,
        position: maxPos + 1,
      })
      .select()
      .single()
    if (error) {
      toast.error('Erro ao adicionar estágio')
      throw error
    }
    setStages((prev) => [...prev, { ...newStage, leads: [] }])
    toast.success('Estágio adicionado')
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full min-h-[400px]">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            onLeadClick={(leadId) => setSelectedLead(leadId)}
            onLeadCreated={handleLeadCreated}
            onLeadDelete={handleLeadDeleted}
            pipelineId={pipelineId}
            onEditStage={handleEditStage}
            onDeleteStage={handleDeleteStage}
            canEditStages={isAdmin}
          />
        ))}
        {isAdmin && (
          <div className="flex w-72 shrink-0 flex-col items-center justify-center rounded-lg border border-dashed">
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setAddStageOpen(true)}
            >
              <Plus className="mr-2 size-4" />
              Adicionar estágio
            </Button>
          </div>
        )}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeLead ? <LeadCardPreview lead={activeLead} /> : null}
      </DragOverlay>

      <AddStageDialog
        open={addStageOpen}
        onOpenChange={setAddStageOpen}
        onAdd={handleAddStage}
      />

      {selectedLead && (
        <LeadDrawer
          leadId={selectedLead}
          pipelineId={pipelineId}
          members={members}
          open={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleLeadUpdated}
          onDelete={handleLeadDeleted}
        />
      )}
    </DndContext>
  )
}
