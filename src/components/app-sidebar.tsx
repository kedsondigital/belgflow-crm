'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Kanban,
  ListTodo,
  Settings,
  LogOut,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Profile } from '@/types/database'

interface AppSidebarProps {
  profile: Profile | null
}

export function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname()
  const isAdmin = profile?.role_global === 'ADMIN'

  const navMain = [
    { title: 'Pipelines', url: '/pipelines', icon: Kanban },
    { title: 'Leads', url: '/leads', icon: LayoutDashboard },
    { title: 'Tarefas', url: '/tasks', icon: ListTodo },
    ...(isAdmin ? [{ title: 'Usuários', url: '/admin/users', icon: Users }] : []),
    { title: 'Configurações', url: '/settings', icon: Settings },
  ]

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/pipelines">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg font-semibold">
                  B
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">BelgiFlow CRM</span>
                  <span className="text-xs text-muted-foreground">Gestão de Leads</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + '/')
                return (
                  <SidebarMenuItem key={item.title}>
                    <Link
                      href={item.url}
                      prefetch={true}
                      className={`flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent ${isActive ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : ''}`}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="mt-auto border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="w-full">
              <Avatar className="size-8">
                <AvatarFallback>
                  {profile?.name?.charAt(0) || profile?.email?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 leading-none text-left">
                <span className="font-medium">{profile?.name || 'Usuário'}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {profile?.email}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 size-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/auth/logout">
                <LogOut className="mr-2 size-4" />
                Sair
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Sidebar>
  )
}
