'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { usePipelineName } from '@/contexts/pipeline-name-context'

export function DashboardHeader() {
  const { pipelineName } = usePipelineName()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      {pipelineName && (
        <h1 className="text-xl font-semibold tracking-tight -ml-1 truncate max-w-[min(50vw,400px)]">
          {pipelineName}
        </h1>
      )}
      <Separator orientation="vertical" className="mr-2 h-4" />
    </header>
  )
}
