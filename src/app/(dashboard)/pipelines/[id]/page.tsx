import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roleGlobal: true },
  })

  const isAdmin = profile?.roleGlobal === 'ADMIN'

  if (!isAdmin) {
    const membership = await prisma.pipelineMember.findUnique({
      where: { pipelineId_userId: { pipelineId: id, userId: session.user.id } },
    })
    if (!membership) redirect('/pipelines')
  }

  // Fetch user pipelines
  let userPipelines: { id: string; name: string }[]
  if (isAdmin) {
    userPipelines = await prisma.pipeline.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' },
    })
  } else {
    const members = await prisma.pipelineMember.findMany({
      where: { userId: session.user.id },
      include: { pipeline: { select: { id: true, name: true, isArchived: true } } },
    })
    userPipelines = members
      .filter((m) => !m.pipeline.isArchived)
      .map((m) => ({ id: m.pipeline.id, name: m.pipeline.name }))
  }

  const [pipeline, stages, leads, members, admins] = await Promise.all([
    prisma.pipeline.findUnique({
      where: { id },
      select: { id: true, name: true, description: true, isArchived: true },
    }),
    prisma.stage.findMany({
      where: { pipelineId: id },
      orderBy: { position: 'asc' },
    }),
    prisma.lead.findMany({
      where: { pipelineId: id },
      include: {
        tags: { select: { tag: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { position: 'asc' },
    }),
    prisma.pipelineMember.findMany({
      where: { pipelineId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.user.findMany({
      where: { roleGlobal: 'ADMIN' },
      select: { id: true, name: true, email: true },
    }),
  ])

  if (!pipeline || pipeline.isArchived) notFound()

  const stagesWithLeads = stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    position: stage.position,
    pipeline_id: stage.pipelineId,
    created_at: stage.createdAt.toISOString(),
    leads: leads
      .filter((l) => l.stageId === stage.id)
      .map((l) => ({
        id: l.id,
        pipeline_id: l.pipelineId,
        stage_id: l.stageId,
        title: l.title,
        email: l.email,
        phone: l.phone,
        phone_country_code: l.phoneCountryCode,
        whatsapp: l.whatsapp,
        website: l.website,
        source: l.source,
        assignee_user_id: l.assigneeUserId,
        notes: l.notes,
        outcome: l.outcome,
        position: l.position,
        resumo: l.resumo,
        nacionalidade: l.nacionalidade,
        valor: l.valor || null,
        linkedin: l.linkedin,
        facebook: l.facebook,
        instagram: l.instagram,
        nome_dono: l.nomeDono,
        email_dono: l.emailDono,
        created_at: l.createdAt.toISOString(),
        updated_at: l.updatedAt.toISOString(),
        lead_tags: l.tags.map((t) => ({ tag: t.tag })),
        profiles: l.assignee
          ? { name: l.assignee.name || '', email: l.assignee.email }
          : null,
      })),
  }))

  const membersMapped = members.map((m) => ({
    id: m.user.id,
    name: m.user.name || '',
    email: m.user.email || '',
  }))

  const adminsMapped = admins.map((p) => ({
    id: p.id,
    name: p.name || '',
    email: p.email || '',
  }))

  const memberIds = new Set(membersMapped.map((m) => m.id))
  const membersMappedAll = [
    ...membersMapped,
    ...adminsMapped.filter((a) => !memberIds.has(a.id)),
  ]

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PipelineNameSetter name={pipeline.name} />
      <PipelineView
        pipelineId={pipeline.id}
        pipelines={userPipelines}
        stagesWithLeads={stagesWithLeads}
        members={membersMappedAll}
        description={pipeline.description}
        isAdmin={isAdmin}
      />
    </div>
  )
}
