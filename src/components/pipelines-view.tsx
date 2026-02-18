'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NewPipelineModal } from '@/components/new-pipeline-modal'

interface PipelinesViewProps {
  pipelines: { id: string; name: string }[]
  isAdmin?: boolean
}

export function PipelinesView({ pipelines, isAdmin = false }: PipelinesViewProps) {
  void pipelines
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)

  const handleCreated = (pipelineId: string) => {
    router.push(`/pipelines/${pipelineId}`)
    router.refresh()
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Lock className="size-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2 text-center text-lg font-medium">
          Sem acesso a pipelines
        </p>
        <p className="text-muted-foreground text-center max-w-md">
          Você não possui acesso a nenhum pipeline.<br />
          Solicite acesso a um administrador.
        </p>
      </div>
    )
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
