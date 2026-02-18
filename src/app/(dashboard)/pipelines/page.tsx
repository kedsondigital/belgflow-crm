import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PipelinesView } from '@/components/pipelines-view'

export default async function PipelinesPage() {
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

  let pipelines: { id: string; name: string }[] = []

  if (isAdmin) {
    // Admin vê todos os pipelines
    const { data } = await supabase
      .from('pipelines')
      .select('id, name')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
    pipelines = data || []
  } else {
    // Membro vê apenas pipelines que tem acesso
    const { data: memberPipelines } = await supabase
      .from('pipeline_members')
      .select('pipeline_id, pipelines(id, name, is_archived)')
      .eq('user_id', user.id)

    pipelines = (memberPipelines || [])
      .filter((m) => {
        const p = m.pipelines as unknown as { id: string; name: string; is_archived: boolean } | null
        return p && !p.is_archived
      })
      .map((m) => {
        const p = m.pipelines as unknown as { id: string; name: string }
        return { id: p.id, name: p.name }
      })
  }

  if (pipelines.length > 0) {
    redirect(`/pipelines/${pipelines[0].id}`)
  }

  return <PipelinesView pipelines={[]} isAdmin={isAdmin} />
}
