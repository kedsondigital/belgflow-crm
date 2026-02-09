'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface SettingsFormProps {
  profile: {
    id: string
    name: string | null
    email: string
  } | null
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const [name, setName] = useState(profile?.name || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim() || null })
      .eq('id', profile!.id)

    if (error) {
      toast.error('Erro ao atualizar')
    } else {
      toast.success('Perfil atualizado')
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Altere suas informações pessoais</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={profile?.email || ''} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground mt-1">
              O email não pode ser alterado aqui
            </p>
          </div>
          <Button type="submit" disabled={loading}>
            Salvar
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
