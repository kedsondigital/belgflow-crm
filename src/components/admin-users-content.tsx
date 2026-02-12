'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import { AddUserModal } from '@/components/add-user-modal'
import { toast } from 'sonner'

interface AdminUsersContentProps {
  users: Array<{
    id: string
    name: string | null
    email: string
    role_global: string
    is_active: boolean
    created_at: string
  }>
  pipelines: { id: string; name: string }[]
  pipelineMembers: { pipeline_id: string; user_id: string; role_in_pipeline: string }[]
}

export function AdminUsersContent({
  users,
  pipelines,
  pipelineMembers,
}: AdminUsersContentProps) {
  const router = useRouter()
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [deletingUser, setDeletingUser] = useState<{ id: string; name: string | null; email: string } | null>(null)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [userPipelineAccess, setUserPipelineAccess] = useState<
    Record<string, string[]>
  >({})
  const [loading, setLoading] = useState(false)

  const getUserPipelines = (userId: string): string[] =>
    pipelineMembers.filter((m) => m.user_id === userId).map((m) => m.pipeline_id)

  const handleOpenEdit = (userId: string) => {
    setEditingUser(userId)
    setUserPipelineAccess({
      [userId]: getUserPipelines(userId),
    })
  }

  const handleTogglePipeline = (userId: string, pipelineId: string) => {
    setUserPipelineAccess((prev) => {
      const current = prev[userId] || getUserPipelines(userId)
      const has = current.includes(pipelineId)
      return {
        ...prev,
        [userId]: has
          ? current.filter((p) => p !== pipelineId)
          : [...current, pipelineId],
      }
    })
  }

  const handleSaveAccess = async () => {
    if (!editingUser) return
    setLoading(true)
    const supabase = createClient()
    const targetPipelines = userPipelineAccess[editingUser] || []

    try {
      await supabase
        .from('pipeline_members')
        .delete()
        .eq('user_id', editingUser)

      if (targetPipelines.length > 0) {
        await supabase.from('pipeline_members').insert(
          targetPipelines.map((pipeline_id) => ({
            pipeline_id,
            user_id: editingUser,
            role_in_pipeline: 'member',
          }))
        )
      }

      toast.success('Acesso atualizado')
      setEditingUser(null)
      router.refresh()
    } catch {
      toast.error('Erro ao atualizar')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    const supabase = createClient()
    
    if (!isAdmin) {
      // Está tornando admin: adiciona acesso a todos os pipelines
      // Remove membros existentes para evitar duplicatas
      await supabase
        .from('pipeline_members')
        .delete()
        .eq('user_id', userId)

      // Adiciona como admin em todos os pipelines
      if (pipelines.length > 0) {
        await supabase.from('pipeline_members').insert(
          pipelines.map((pipeline) => ({
            pipeline_id: pipeline.id,
            user_id: userId,
            role_in_pipeline: 'admin',
          }))
        )
      }
    } else {
      // Está removendo admin: remove acesso a todos os pipelines
      await supabase
        .from('pipeline_members')
        .delete()
        .eq('user_id', userId)
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role_global: isAdmin ? 'MEMBER' : 'ADMIN' })
      .eq('id', userId)

    if (error) {
      toast.error('Erro ao alterar permissão')
    } else {
      toast.success(isAdmin ? 'Permissão de Admin removida e acessos aos pipelines revogados' : 'Usuário agora é Admin com acesso completo a todos os pipelines')
      router.refresh()
    }
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !isActive })
      .eq('id', userId)

    if (error) {
      toast.error('Erro ao alterar status')
    } else {
      toast.success('Status atualizado')
      router.refresh()
    }
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return
    setLoading(true)
    const supabase = createClient()

    try {
      // Remove o usuário de todos os pipelines
      await supabase
        .from('pipeline_members')
        .delete()
        .eq('user_id', deletingUser.id)

      // Remove o perfil do usuário
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deletingUser.id)

      if (error) throw error

      toast.success('Usuário removido com sucesso')
      setDeletingUser(null)
      router.refresh()
    } catch {
      toast.error('Erro ao remover usuário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, papéis e acesso a pipelines
          </p>
        </div>
        <Button onClick={() => setAddUserOpen(true)}>
          <Plus className="mr-2 size-4" />
          Adicionar usuário
        </Button>
      </div>

      <AddUserModal
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onUserCreated={() => router.refresh()}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Acesso Pipelines</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name || '-'}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={u.role_global === 'ADMIN' ? 'default' : 'secondary'}
                  >
                    {u.role_global}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.is_active ? 'outline' : 'destructive'}>
                    {u.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {getUserPipelines(u.id).length} pipeline(s)
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(u.id)}
                    >
                      Acesso
                    </Button>
                    {u.role_global !== 'ADMIN' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAdmin(u.id, false)}
                      >
                        Tornar Admin
                      </Button>
                    )}
                    {u.role_global === 'ADMIN' && users.filter((x) => x.role_global === 'ADMIN').length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAdmin(u.id, true)}
                      >
                        Remover Admin
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(u.id, u.is_active)}
                    >
                      {u.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    {users.filter((x) => x.role_global === 'ADMIN').length > 1 || u.role_global !== 'ADMIN' ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingUser({ id: u.id, name: u.name, email: u.email })}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acesso a Pipelines</DialogTitle>
            <DialogDescription>
              Selecione os pipelines que este usuário pode acessar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {pipelines.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2"
              >
                <Checkbox
                  id={`pipeline-${p.id}`}
                  checked={
                    (userPipelineAccess[editingUser!] || getUserPipelines(editingUser!)).includes(
                      p.id
                    )
                  }
                  onCheckedChange={() =>
                    editingUser && handleTogglePipeline(editingUser, p.id)
                  }
                />
                <Label htmlFor={`pipeline-${p.id}`}>{p.name}</Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAccess} disabled={loading}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o usuário{' '}
              <strong>{deletingUser?.name || deletingUser?.email}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingUser(null)} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={loading}>
              {loading ? 'Removendo...' : 'Remover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
