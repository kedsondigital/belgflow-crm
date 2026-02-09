import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { DashboardHeader } from '@/components/dashboard-header'
import { PipelineNameProvider } from '@/contexts/pipeline-name-context'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <PipelineNameProvider>
      <SidebarProvider>
        <AppSidebar profile={profile} />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </PipelineNameProvider>
  )
}
