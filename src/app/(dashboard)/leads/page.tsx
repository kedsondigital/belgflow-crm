import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'

const LeadsTable = dynamic(
  () => import('@/components/leads-table').then((m) => m.LeadsTable),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: true,
  }
)

export default async function LeadsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [leadsRes, pipelinesRes] = await Promise.all([
    supabase
      .from('leads')
      .select(`id, title, email, phone, source, outcome, created_at, stage_id, assignee_user_id, lead_tags(tag), stages(name, pipeline_id), profiles:assignee_user_id(name, email)`)
      .order('created_at', { ascending: false }),
    supabase.from('pipelines').select('id, name').eq('is_archived', false),
  ])

  const leads = leadsRes.data || []
  const pipelines = pipelinesRes.data || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todos os leads
        </p>
      </div>
      <LeadsTable
        leads={leads}
        pipelines={pipelines}
      />
    </div>
  )
}
