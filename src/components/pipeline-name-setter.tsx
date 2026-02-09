'use client'

import { useEffect } from 'react'
import { usePipelineName } from '@/contexts/pipeline-name-context'

export function PipelineNameSetter({ name }: { name: string }) {
  const { setPipelineName } = usePipelineName()
  useEffect(() => {
    setPipelineName(name)
    return () => setPipelineName(null)
  }, [name, setPipelineName])
  return null
}
