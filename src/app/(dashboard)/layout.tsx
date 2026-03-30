import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { DashboardHeader } from '@/components/dashboard-header'
import { PipelineNameProvider } from '@/contexts/pipeline-name-context'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session?.user) {
    redirect('/login')
  }

  let profile = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!profile && session.user.email) {
    profile = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
  }

  const profileData = profile
    ? {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role_global: profile.roleGlobal,
        avatar_url: profile.avatarUrl,
        is_active: profile.isActive,
        created_at: profile.createdAt.toISOString(),
        updated_at: profile.updatedAt.toISOString(),
      }
    : null

  return (
    <PipelineNameProvider>
      <SidebarProvider>
        <AppSidebar profile={profileData} />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </PipelineNameProvider>
  )
}
