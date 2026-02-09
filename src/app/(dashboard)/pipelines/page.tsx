import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PipelinesView } from '@/components/pipelines-view'

export default async function PipelinesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: pipelines } = await supabase
    .from('pipelines')
    .select('id, name')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (pipelines && pipelines.length > 0) {
    redirect(`/pipelines/${pipelines[0].id}`)
  }

  return <PipelinesView pipelines={[]} />
}
