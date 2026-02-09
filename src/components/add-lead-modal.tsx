'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
import { PhoneInput } from '@/components/phone-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/utils'
import type { Lead } from '@/types/database'

const NACIONALIDADES = [
  'Brasil', 'Portugal', 'Espanha', 'Argentina', 'EUA', 'Reino Unido',
  'França', 'Alemanha', 'Itália', 'México', 'Chile', 'Colômbia',
  'Outro',
]

interface AddLeadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pipelineId: string
  stageId?: string
  stageName?: string
  position?: number
  stages?: { id: string; name: string; position: number; leads?: unknown[] }[]
  onLeadCreated: (lead: Lead) => void
}

export function AddLeadModal({
  open,
  onOpenChange,
  pipelineId,
  stageId: initialStageId,
  stageName: initialStageName,
  position: initialPosition,
  stages,
  onLeadCreated,
}: AddLeadModalProps) {
  const [selectedStageId, setSelectedStageId] = useState(initialStageId || '')
  const stageId = initialStageId || selectedStageId
  const selectedStage = stages?.find((s) => s.id === stageId)
  const stageName = initialStageName || selectedStage?.name || ''
  const position = initialPosition ?? (selectedStage?.leads?.length ?? 0)
  const [title, setTitle] = useState('')
  const [email, setEmail] = useState('')
  const [phoneCountryCode, setPhoneCountryCode] = useState('32')
  const [phone, setPhone] = useState('')
  const [resumo, setResumo] = useState('')
  const [nacionalidade, setNacionalidade] = useState<string>('__none__')
  const [valor, setValor] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Nome/empresa é obrigatório')
      return
    }
    if (!stageId) {
      toast.error('Selecione o estágio')
      return
    }
    setLoading(true)
    try {
      const fullPhone = phone.trim() ? `${phoneCountryCode}${phone.replace(/\D/g, '')}` : null
      const parsedValor = valor ? parseFloat(String(valor).replace(/\./g, '').replace(',', '.')) : null
      const valorNum = parsedValor != null && !Number.isNaN(parsedValor) ? parsedValor : null

      const { data: lead, error } = await createClient()
        .from('leads')
        .insert({
          pipeline_id: pipelineId,
          stage_id: stageId,
          title: title.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          phone_country_code: phone.trim() ? phoneCountryCode : null,
          whatsapp: fullPhone,
          resumo: resumo.trim() || null,
          nacionalidade: nacionalidade && nacionalidade !== '__none__' ? nacionalidade : null,
          valor: valorNum ?? null,
          source: 'manual',
          position,
        })
        .select()
        .single()

      if (error) throw error

      await createClient().from('lead_activities').insert({
        lead_id: lead.id,
        type: 'created',
        payload: {},
      })

      setTitle('')
      setEmail('')
      setPhone('')
      setPhoneCountryCode('32')
      setResumo('')
      setNacionalidade('__none__')
      setValor('')
      onOpenChange(false)
      onLeadCreated(lead)
      toast.success('Lead adicionado!')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao criar lead'))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setEmail('')
    setPhone('')
    setPhoneCountryCode('55')
    setResumo('')
    setNacionalidade('__none__')
    setValor('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar lead</DialogTitle>
          <DialogDescription>
            {stageName ? `Novo lead no estágio ${stageName}` : 'Preencha os dados do lead'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {stages && stages.length > 0 && !initialStageId && (
            <div>
              <Label>Estágio *</Label>
              <Select value={stageId} onValueChange={setSelectedStageId} required disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estágio" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="lead-title">Nome / Empresa *</Label>
            <Input
              id="lead-title"
              placeholder="Ex: Empresa XYZ"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label>Telefone / WhatsApp (com DDI do país)</Label>
            <PhoneInput
              countryCode={phoneCountryCode}
              number={phone}
              onCountryCodeChange={setPhoneCountryCode}
              onNumberChange={setPhone}
              placeholder="(11) 99999-9999"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="lead-email">Email</Label>
            <Input
              id="lead-email"
              type="email"
              placeholder="contato@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="lead-resumo">Resumo</Label>
            <textarea
              id="lead-resumo"
              className="w-full min-h-[60px] rounded-md border px-3 py-2 text-sm"
              placeholder="Breve resumo do lead..."
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label>Possível nacionalidade</Label>
            <Select value={nacionalidade} onValueChange={setNacionalidade} disabled={loading}>
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
            <Label htmlFor="lead-valor">Valor (€)</Label>
            <Input
              id="lead-valor"
              type="text"
              inputMode="decimal"
              placeholder="Ex: 1.000,00 ou 1000"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              disabled={loading}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !title.trim() || !stageId}>
              {loading ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
