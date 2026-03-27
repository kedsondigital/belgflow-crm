import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PipelinesView } from '@/components/pipelines-view'

export default async function PipelinesPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roleGlobal: true },
  })

  const isAdmin = profile?.roleGlobal === 'ADMIN'

  let pipelines: { id: string; name: string }[]

  if (isAdmin) {
    pipelines = await prisma.pipeline.findMany({
      where: { isArchived: false },
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' },
    })
  } else {
    const members = await prisma.pipelineMember.findMany({
      where: { userId: session.user.id },
      include: { pipeline: { select: { id: true, name: true, isArchived: true } } },
    })
    pipelines = members
      .filter((m) => !m.pipeline.isArchived)
      .map((m) => ({ id: m.pipeline.id, name: m.pipeline.name }))
  }

  if (pipelines.length > 0) {
    redirect(`/pipelines/${pipelines[0].id}`)
  }

  return <PipelinesView pipelines={[]} isAdmin={isAdmin} />
}
