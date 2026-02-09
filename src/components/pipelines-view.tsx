'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NewPipelineModal } from '@/components/new-pipeline-modal'

interface PipelinesViewProps {
  pipelines: { id: string; name: string }[]
}

export function PipelinesView(props: PipelinesViewProps) {
  void props // Empty state - no pipelines to display
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)

  const handleCreated = (pipelineId: string) => {
    router.push(`/pipelines/${pipelineId}`)
    router.refresh()
  }

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <p className="text-muted-foreground mb-6 text-center">
        Nenhum pipeline encontrado.<br />
        Crie seu primeiro pipeline para começar.
      </p>
      <NewPipelineModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={handleCreated}
      />
      <Button onClick={() => setModalOpen(true)}>
        <Plus className="mr-2 size-4" />
        Criar primeiro pipeline
      </Button>
    </div>
  )
}
