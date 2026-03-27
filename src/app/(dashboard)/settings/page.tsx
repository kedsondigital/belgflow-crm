import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/settings-form'

export default async function SettingsPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Atualize seu perfil
        </p>
      </div>
      <SettingsForm profile={profile} />
    </div>
  )
}
