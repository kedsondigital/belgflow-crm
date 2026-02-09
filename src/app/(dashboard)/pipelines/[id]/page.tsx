import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PipelineNameSetter } from '@/components/pipeline-name-setter'
import { PipelineView } from '@/components/pipeline-view'

export const dynamic = 'force-dynamic'

export default async function PipelinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [pipelinesRes, pipelineRes, stagesRes, leadsRes, membersRes] =
    await Promise.all([
      supabase.from('pipelines').select('id, name').eq('is_archived', false).order('created_at', { ascending: false }),
      supabase.from('pipelines').select('id, name, description, is_archived').eq('id', id).single(),
      supabase.from('stages').select('*').eq('pipeline_id', id).order('position', { ascending: true }),
      supabase.from('leads').select(`*, lead_tags(tag), profiles:assignee_user_id(id, name, email)`).eq('pipeline_id', id).order('position', { ascending: true }),
      supabase.from('pipeline_members').select('user_id, profiles(id, name, email, role_global)').eq('pipeline_id', id),
    ])

  const pipeline = pipelineRes.data
  if (!pipeline || pipeline.is_archived) notFound()

  const stages = stagesRes.data || []
  const leads = leadsRes.data || []
  const members = membersRes.data || []
  const pipelines = pipelinesRes.data || []

  const stagesWithLeads = stages.map((stage) => ({
    ...stage,
    leads: leads.filter((l) => l.stage_id === stage.id),
  }))

  const membersMapped = members
    .map((m) => {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      return {
        id: m.user_id,
        name: (p as { name?: string })?.name || '',
        email: (p as { email?: string })?.email || '',
        role_global: (p as { role_global?: string })?.role_global,
      }
    })
    .filter((m) => m.role_global !== 'ADMIN')
    .map(({ id, name, email }) => ({ id, name, email }))

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PipelineNameSetter name={pipeline.name} />
      <PipelineView
        pipelineId={pipeline.id}
        pipelines={pipelines}
        stagesWithLeads={stagesWithLeads}
        members={membersMapped}
        description={pipeline.description}
      />
    </div>
  )
}
