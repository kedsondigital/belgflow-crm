'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Mail, Phone, Globe, MessageSquare, Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage, formatCurrency } from '@/lib/utils'
import { PhoneInput } from '@/components/phone-input'
import { AddTaskModal } from '@/components/add-task-modal'
import { EditTaskModal } from '@/components/edit-task-modal'
import { getWhatsAppLink } from '@/lib/country-codes'

const NACIONALIDADES = [
  'Brasil', 'Portugal', 'Espanha', 'Argentina', 'EUA', 'Reino Unido',
  'França', 'Alemanha', 'Itália', 'México', 'Chile', 'Colômbia', 'Outro',
]

interface LeadDrawerProps {
  leadId: string
  pipelineId?: string
  members: { id: string; name: string; email: string }[]
  open: boolean
  onClose: () => void
  onUpdate: (close?: boolean) => void
  onDelete?: (leadId: string) => void
}

export function LeadDrawer({
  leadId,
  members,
  open,
  onClose,
  onUpdate,
  onDelete,
}: LeadDrawerProps) {
  const [lead, setLead] = useState<Record<string, unknown> | null>(null)
  const [activities, setActivities] = useState<Record<string, unknown>[]>([])
  const [tasks, setTasks] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    email: '',
    phone: '',
    phone_country_code: '32',
    whatsapp: '',
    website: '',
    source: 'manual',
    notes: '',
    assignee_user_id: '',
    resumo: '',
    nacionalidade: '',
    valor: '',
  })
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [editTaskOpen, setEditTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<{
    id: string
    title: string
    description: string | null
    due_date: string | null
    status: string
    assigned_to: string | null
  } | null>(null)
  const [newNote, setNewNote] = useState('')
  const [newTag, setNewTag] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (!open || !leadId) return

    const fetchData = async () => {
      setLoading(true)
      const { data: leadData } = await supabase
        .from('leads')
        .select(`
          *,
          lead_tags(tag)
        `)
        .eq('id', leadId)
        .single()

      if (leadData) {
        setLead(leadData)
        const pcCode = (leadData.phone_country_code as string) || '32'
        const wapp = String(leadData.whatsapp || '').replace(/\D/g, '')
        const ph = (leadData.phone as string) || ''
        let numPart = ph
        if (wapp && !ph) {
          const code = pcCode.replace(/\D/g, '')
          numPart = wapp.startsWith(code) ? wapp.slice(code.length) : wapp
        }
        setFormData({
          title: (leadData.title as string) || '',
          email: (leadData.email as string) || '',
          phone: numPart || ph.replace(/\D/g, ''),
          phone_country_code: pcCode,
          whatsapp: wapp,
          website: (leadData.website as string) || '',
          source: (leadData.source as string) || 'manual',
          notes: (leadData.notes as string) || '',
          assignee_user_id: (leadData.assignee_user_id as string) || '',
          resumo: (leadData.resumo as string) || '',
          nacionalidade: (leadData.nacionalidade as string) || '',
          valor: (leadData.valor as number) != null ? String(leadData.valor) : '',
        })
      }

      const { data: activitiesData } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      setActivities(activitiesData || [])

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('lead_id', leadId)
        .order('due_date', { ascending: true })

      setTasks(tasksData || [])
      setLoading(false)
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leadId])

  const handleDeleteLead = async () => {
    if (!confirm('Excluir este lead? Esta ação não pode ser desfeita.')) return
    try {
      const { error } = await supabase.from('leads').delete().eq('id', leadId)
      if (error) throw error
      toast.success('Lead excluído')
      onClose()
      onDelete?.(leadId)
      onUpdate()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao excluir lead'))
    }
  }

  const handleAssigneeChange = async (newAssigneeId: string) => {
    const prevAssigneeId = formData.assignee_user_id
    const prevEffective = prevAssigneeId && prevAssigneeId !== '__none__' ? prevAssigneeId : null
    const effectiveNew = newAssigneeId && newAssigneeId !== '__none__' ? newAssigneeId : null
    if (prevEffective === effectiveNew) return

    setFormData((p) => ({ ...p, assignee_user_id: newAssigneeId }))
    try {
      const { error } = await supabase
        .from('leads')
        .update({ assignee_user_id: effectiveNew })
        .eq('id', leadId)

      if (error) throw error

      await supabase.from('lead_activities').insert({
        lead_id: leadId,
        type: 'assignee_change',
        payload: {
          old_assignee_id: prevEffective,
          new_assignee_id: effectiveNew,
        },
      })

      setActivities((prev) => [
        {
          type: 'assignee_change',
          payload: { old_assignee_id: prevEffective, new_assignee_id: effectiveNew },
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
      toast.success('Responsável atualizado')
      onUpdate()
    } catch (err) {
      setFormData((p) => ({ ...p, assignee_user_id: prevAssigneeId }))
      toast.error(getErrorMessage(err, 'Erro ao alterar responsável'))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const prevAssigneeId = formData.assignee_user_id
    try {
      const fullPhone = formData.phone
        ? `${formData.phone_country_code}${formData.phone.replace(/\D/g, '')}`
        : null
      const valorNum = formData.valor
        ? (() => {
            const v = parseFloat(String(formData.valor).replace(/\./g, '').replace(',', '.'))
            return v != null && !Number.isNaN(v) ? v : null
          })()
        : null

      const newAssigneeId = formData.assignee_user_id && formData.assignee_user_id !== '__none__' ? formData.assignee_user_id : null

      const { error: updateError } = await supabase
        .from('leads')
        .update({
          title: formData.title,
          email: formData.email || null,
          phone: formData.phone || null,
          phone_country_code: formData.phone ? formData.phone_country_code : null,
          whatsapp: fullPhone,
          website: formData.website || null,
          source: formData.source,
          notes: formData.notes || null,
          assignee_user_id: newAssigneeId,
          resumo: formData.resumo || null,
          nacionalidade: formData.nacionalidade && formData.nacionalidade !== '__none__' ? formData.nacionalidade : null,
          valor: valorNum,
        })
        .eq('id', leadId)

      if (updateError) throw updateError

      const assigneeChanged = (prevAssigneeId || '__none__') !== (newAssigneeId || '__none__')
      if (assigneeChanged) {
        await supabase.from('lead_activities').insert({
          lead_id: leadId,
          type: 'assignee_change',
          payload: {
            old_assignee_id: prevAssigneeId && prevAssigneeId !== '__none__' ? prevAssigneeId : null,
            new_assignee_id: newAssigneeId,
          },
        })
      }

      await supabase.from('lead_activities').insert({
        lead_id: leadId,
        type: 'field_edit',
        payload: { fields: Object.keys(formData) },
      })

      toast.success('Lead atualizado')
      setEditMode(false)
      onUpdate(true)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao salvar'))
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    const noteText = newNote.trim()
    try {
      await supabase.from('lead_activities').insert({
        lead_id: leadId,
        type: 'note_added',
        payload: { note: noteText },
      })

      const updatedNotes = [formData.notes, noteText].filter(Boolean).join('\n\n')
      const { error } = await supabase
        .from('leads')
        .update({ notes: updatedNotes })
        .eq('id', leadId)

      if (error) throw error

      setFormData((p) => ({ ...p, notes: updatedNotes }))
      setNewNote('')
      setActivities((prev) => [
        { type: 'note_added', payload: { note: noteText }, created_at: new Date().toISOString() },
        ...prev,
      ])
      toast.success('Nota adicionada')
      onUpdate()
    } catch {
      toast.error('Erro ao adicionar nota')
    }
  }

  const handleAddTag = async () => {
    if (!newTag.trim()) return
    const tag = newTag.trim().toLowerCase()
    try {
      await supabase.from('lead_tags').insert({ lead_id: leadId, tag })
      await supabase.from('lead_activities').insert({
        lead_id: leadId,
        type: 'tag_added',
        payload: { tag },
      })
      setLead((p) =>
        p
          ? {
              ...p,
              lead_tags: [...((p.lead_tags as { tag: string }[]) || []), { tag }],
            }
          : null
      )
      setNewTag('')
      toast.success('Tag adicionada')
      onUpdate()
    } catch {
      toast.error('Tag já existe ou erro ao adicionar')
    }
  }

  const handleRemoveTag = async (tag: string) => {
    try {
      await supabase.from('lead_tags').delete().eq('lead_id', leadId).eq('tag', tag)
      setLead((p) =>
        p
          ? {
              ...p,
              lead_tags: ((p.lead_tags as { tag: string }[]) || []).filter(
                (t) => t.tag !== tag
              ),
            }
          :           null
      )
      onUpdate()
    } catch {
      toast.error('Erro ao remover tag')
    }
  }

  const tags = (lead?.lead_tags as { tag: string }[]) || []

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes do Lead</SheetTitle>
          <SheetDescription>
            Visualize e edite as informações do lead
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : lead ? (
          <Tabs defaultValue="details" className="mt-6">
            <TabsList>
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="activity">Atividades</TabsTrigger>
              <TabsTrigger value="tasks">Tarefas</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <Label>Nome/Empresa</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, title: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, email: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Telefone / WhatsApp (DDI + número)</Label>
                    <PhoneInput
                      countryCode={formData.phone_country_code}
                      number={formData.phone}
                      onCountryCodeChange={(v) =>
                        setFormData((p) => ({ ...p, phone_country_code: v }))
                      }
                      onNumberChange={(v) =>
                        setFormData((p) => ({ ...p, phone: v }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Site</Label>
                    <Input
                      value={formData.website}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, website: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Resumo</Label>
                    <textarea
                      className="w-full min-h-[60px] rounded-md border px-3 py-2 text-sm"
                      value={formData.resumo}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, resumo: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Possível nacionalidade</Label>
                    <Select
                      value={formData.nacionalidade || '__none__'}
                      onValueChange={(v) =>
                        setFormData((p) => ({ ...p, nacionalidade: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhuma</SelectItem>
                        {NACIONALIDADES.map((n) => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valor (€)</Label>
                    <Input
                      value={formData.valor}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, valor: e.target.value }))
                      }
                      placeholder="Ex: 1.000,00 ou 1000"
                      inputMode="decimal"
                    />
                  </div>
                  <div>
                    <Label>Origem</Label>
                    <Input
                      value={formData.source}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, source: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Responsável</Label>
                    <Select
                      value={formData.assignee_user_id || '__none__'}
                      onValueChange={(v) =>
                        setFormData((p) => ({ ...p, assignee_user_id: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name || m.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Notas</Label>
                    <textarea
                      className="w-full min-h-[100px] rounded-md border px-3 py-2 text-sm"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, notes: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving}>
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditMode(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">{formData.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formData.source}
                    </p>
                  </div>
                  {formData.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-muted-foreground" />
                      <a
                        href={`mailto:${formData.email}`}
                        className="text-sm hover:underline"
                      >
                        {formData.email}
                      </a>
                    </div>
                  )}
                  {(formData.phone || formData.whatsapp) && (
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-muted-foreground" />
                      <span className="text-sm">
                        +{formData.phone_country_code} {formData.phone || formData.whatsapp}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a
                          href={getWhatsAppLink(
                            formData.phone_country_code,
                            formData.phone || formData.whatsapp || ''
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Entrar em contato (WhatsApp)
                        </a>
                      </Button>
                    </div>
                  )}
                  {formData.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="size-4 text-muted-foreground" />
                      <a
                        href={formData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline truncate"
                      >
                        {formData.website}
                      </a>
                    </div>
                  )}
                  <div>
                    <Label>Responsável</Label>
                    <Select
                      value={formData.assignee_user_id || '__none__'}
                      onValueChange={handleAssigneeChange}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Não atribuído</SelectItem>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name || m.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.resumo && (
                    <div>
                      <Label>Resumo</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{formData.resumo}</p>
                    </div>
                  )}
                  {((formData.nacionalidade && formData.nacionalidade !== '__none__') || formData.valor) && (
                    <div className="flex gap-4">
                      {formData.nacionalidade && formData.nacionalidade !== '__none__' && (
                        <div>
                          <Label>Nacionalidade</Label>
                          <p className="text-sm mt-1">{formData.nacionalidade}</p>
                        </div>
                      )}
                      {formData.valor && (
                        <div>
                          <Label>Valor</Label>
                          <p className="text-sm mt-1">
                            {formatCurrency(formData.valor)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {formData.notes && (
                    <div>
                      <Label>Notas</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">
                        {formData.notes}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tags.map((t) => (
                        <Badge
                          key={t.tag}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => handleRemoveTag(t.tag)}
                        >
                          {t.tag} ×
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Nova tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && (e.preventDefault(), handleAddTag())
                        }
                      />
                      <Button size="sm" onClick={handleAddTag}>
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4">
                    <Button onClick={() => setEditMode(true)}>
                      Editar
                    </Button>
                    {onDelete && (
                      <Button variant="destructive" onClick={handleDeleteLead}>
                        <Trash2 className="mr-2 size-4" />
                        Excluir lead
                      </Button>
                    )}
                    <div className="flex gap-2 flex-1">
                      <Input
                        placeholder="Adicionar nota..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                      />
                      <Button size="sm" onClick={handleAddNote}>
                        <MessageSquare className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma atividade registrada
                    </p>
                  ) : (
                    activities.map((a, i) => (
                      <div
                        key={i}
                        className="rounded-lg border p-3 text-sm"
                      >
                        <p className="font-medium">
                          {a.type === 'stage_change' && 'Estágio alterado'}
                          {a.type === 'assignee_change' && (() => {
                            const p = a.payload as { old_assignee_id?: string | null; new_assignee_id?: string | null }
                            const oldName = p?.old_assignee_id ? members.find((m) => m.id === p.old_assignee_id)?.name : null
                            const newName = p?.new_assignee_id ? members.find((m) => m.id === p.new_assignee_id)?.name : null
                            if (oldName && newName) return `Responsável: ${oldName} → ${newName}`
                            if (newName) return `Responsável: ${newName}`
                            if (oldName) return `Responsável removido (era ${oldName})`
                            return 'Responsável alterado'
                          })()}
                          {a.type === 'field_edit' && 'Dados editados'}
                          {a.type === 'note_added' &&
                            `Nota: ${(a.payload as { note?: string })?.note || ''}`}
                          {a.type === 'tag_added' &&
                            `Tag adicionada: ${(a.payload as { tag?: string })?.tag || ''}`}
                          {a.type === 'created' && 'Lead criado'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(a.created_at as string).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <div className="mb-3">
                <Button size="sm" onClick={() => setAddTaskOpen(true)}>
                  <Plus className="mr-2 size-4" />
                  Adicionar tarefa
                </Button>
              </div>
              <ScrollArea className="h-[360px]">
                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma tarefa
                    </p>
                  ) : (
                    (tasks as { id: string; title: string; description: string | null; status: string; due_date: string; assigned_to: string | null }[]).map(
                      (t) => (
                        <div
                          key={t.id}
                          className="group rounded-lg border p-3 text-sm flex items-start justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{t.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {t.status} •{' '}
                              {t.due_date
                                ? new Date(t.due_date).toLocaleDateString('pt-BR')
                                : 'Sem data'}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingTask({
                                  id: t.id,
                                  title: t.title,
                                  description: t.description || null,
                                  due_date: t.due_date || null,
                                  status: t.status,
                                  assigned_to: t.assigned_to || null,
                                })
                                setEditTaskOpen(true)
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!confirm('Excluir esta tarefa?')) return
                                supabase
                                  .from('tasks')
                                  .delete()
                                  .eq('id', t.id)
                                  .then(({ error }) => {
                                    if (error) toast.error(getErrorMessage(error, 'Erro ao excluir'))
                                    else {
                                      setTasks((prev) => prev.filter((x) => x.id !== t.id))
                                      toast.success('Tarefa excluída')
                                    }
                                  })
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </ScrollArea>
              <AddTaskModal
                open={addTaskOpen}
                onOpenChange={setAddTaskOpen}
                leadId={leadId}
                onTaskCreated={() => {
                  supabase
                    .from('tasks')
                    .select('*')
                    .eq('lead_id', leadId)
                    .order('due_date', { ascending: true })
                    .then(({ data }) => setTasks(data || []))
                }}
                members={members}
              />
              <EditTaskModal
                open={editTaskOpen}
                onOpenChange={setEditTaskOpen}
                task={editingTask}
                onTaskUpdated={() => {
                  supabase
                    .from('tasks')
                    .select('*')
                    .eq('lead_id', leadId)
                    .order('due_date', { ascending: true })
                    .then(({ data }) => setTasks(data || []))
                }}
                members={members}
              />
            </TabsContent>
          </Tabs>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
