import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AdminUsersContent } from '@/components/admin-users-content'

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roleGlobal: true },
  })

  if (profile?.roleGlobal !== 'ADMIN') {
    redirect('/pipelines')
  }

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
  const pipelines = await prisma.pipeline.findMany({
    where: { isArchived: false },
    select: { id: true, name: true },
  })
  const pipelineMembers = await prisma.pipelineMember.findMany({
    select: { pipelineId: true, userId: true, roleInPipeline: true },
  })

  return (
    <AdminUsersContent
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role_global: u.roleGlobal,
        is_active: u.isActive,
        created_at: u.createdAt.toISOString(),
      }))}
      pipelines={pipelines}
      pipelineMembers={pipelineMembers.map((m) => ({
        pipeline_id: m.pipelineId,
        user_id: m.userId,
        role_in_pipeline: m.roleInPipeline,
      }))}
    />
  )
}
