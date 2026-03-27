import dynamic from 'next/dynamic'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const [leads, pipelines] = await Promise.all([
    prisma.lead.findMany({
      include: {
        tags: { select: { tag: true } },
        stage: { select: { name: true, pipelineId: true } },
        assignee: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.pipeline.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
    }),
  ])

  const leadsData = leads.map((l) => ({
    id: l.id,
    title: l.title,
    email: l.email,
    phone: l.phone,
    source: l.source,
    outcome: l.outcome,
    created_at: l.createdAt.toISOString(),
    stage_id: l.stageId,
    assignee_user_id: l.assigneeUserId,
    lead_tags: l.tags.map((t) => ({ tag: t.tag })),
    stages: { name: l.stage.name, pipeline_id: l.stage.pipelineId },
    profiles: l.assignee ? { name: l.assignee.name || '', email: l.assignee.email } : null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todos os leads
        </p>
      </div>
      <LeadsTable leads={leadsData} pipelines={pipelines} />
    </div>
  )
}
