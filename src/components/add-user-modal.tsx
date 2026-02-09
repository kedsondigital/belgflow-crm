'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface AddUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserCreated: () => void
}

export function AddUserModal({
  open,
  onOpenChange,
  onUserCreated,
}: AddUserModalProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Email é obrigatório')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || null,
          password: password || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar usuário')
      }

      setEmail('')
      setName('')
      setPassword('')
      onOpenChange(false)
      onUserCreated()
      toast.success('Usuário criado! Envie o link de redefinição de senha se necessário.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar usuário')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setName('')
    setPassword('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar usuário</DialogTitle>
          <DialogDescription>
            Crie um novo usuário. Se não definir senha, o usuário poderá redefinir via email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="user-email">Email *</Label>
            <Input
              id="user-email"
              type="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="user-name">Nome</Label>
            <Input
              id="user-name"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="user-password">Senha (opcional)</Label>
            <Input
              id="user-password"
              type="password"
              placeholder="Deixe em branco para convite por email"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !email.trim()}>
              {loading ? 'Criando...' : 'Criar usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
