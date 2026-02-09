import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminUsersContent } from '@/components/admin-users-content'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role_global')
    .eq('id', user.id)
    .single()

  if (profile?.role_global !== 'ADMIN') {
    redirect('/pipelines')
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: pipelines } = await supabase
    .from('pipelines')
    .select('id, name')
    .eq('is_archived', false)

  const { data: pipelineMembers } = await supabase
    .from('pipeline_members')
    .select('pipeline_id, user_id, role_in_pipeline')

  return (
    <AdminUsersContent
      users={users || []}
      pipelines={pipelines || []}
      pipelineMembers={pipelineMembers || []}
    />
  )
}
