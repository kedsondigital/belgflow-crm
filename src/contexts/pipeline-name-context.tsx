'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

const PipelineNameContext = createContext<{
  pipelineName: string | null
  setPipelineName: (name: string | null) => void
}>({ pipelineName: null, setPipelineName: () => {} })

export function PipelineNameProvider({ children }: { children: ReactNode }) {
  const [pipelineName, setPipelineName] = useState<string | null>(null)
  return (
    <PipelineNameContext.Provider value={{ pipelineName, setPipelineName }}>
      {children}
    </PipelineNameContext.Provider>
  )
}

export function usePipelineName() {
  return useContext(PipelineNameContext)
}
