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

  // Busca o perfil do usuário para verificar se é admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role_global')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role_global === 'ADMIN'

  // Verifica se o usuário tem acesso a este pipeline (se não for admin)
  if (!isAdmin) {
    const { data: membership } = await supabase
      .from('pipeline_members')
      .select('id')
      .eq('pipeline_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      redirect('/pipelines')
    }
  }

  // Busca pipelines que o usuário tem acesso
  let userPipelines: { id: string; name: string }[] = []
  
  if (isAdmin) {
    const { data } = await supabase
      .from('pipelines')
      .select('id, name')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
    userPipelines = data || []
  } else {
    const { data: memberPipelines } = await supabase
      .from('pipeline_members')
      .select('pipeline_id, pipelines(id, name, is_archived)')
      .eq('user_id', user.id)

    userPipelines = (memberPipelines || [])
      .filter((m) => {
        const p = m.pipelines as unknown as { id: string; name: string; is_archived: boolean } | null
        return p && !p.is_archived
      })
      .map((m) => {
        const p = m.pipelines as unknown as { id: string; name: string }
        return { id: p.id, name: p.name }
      })
  }

  const [pipelineRes, stagesRes, leadsRes, membersRes] =
    await Promise.all([
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
        pipelines={userPipelines}
        stagesWithLeads={stagesWithLeads}
        members={membersMapped}
        description={pipeline.description}
        isAdmin={isAdmin}
      />
    </div>
  )
}
