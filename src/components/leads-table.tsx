'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface LeadsTableProps {
  leads: Array<{
    id: string
    title: string
    email: string | null
    phone: string | null
    source: string
    outcome: string
    created_at: string
    stage_id: string
    assignee_user_id: string | null
    lead_tags?: { tag: string }[]
    stages?: { name: string; pipeline_id: string } | { name: string; pipeline_id: string }[] | null
    profiles?: { name: string; email: string } | { name: string; email: string }[] | null
  }>
  pipelines: { id: string; name: string }[]
}

export function LeadsTable({ leads: initialLeads, pipelines }: LeadsTableProps) {
  const [search, setSearch] = useState('')
  const [filterPipeline, setFilterPipeline] = useState<string>('all')
  const [filterSource, setFilterSource] = useState<string>('all')

  const sources = Array.from(new Set(initialLeads.map((l) => l.source).filter(Boolean)))

  const filteredLeads = initialLeads.filter((lead) => {
    const matchSearch =
      !search ||
      lead.title?.toLowerCase().includes(search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(search.toLowerCase()) ||
      lead.lead_tags?.some((t) =>
        t.tag.toLowerCase().includes(search.toLowerCase())
      )
    const matchPipeline =
      filterPipeline === 'all' ||
      (lead.stages as { pipeline_id?: string } | null)?.pipeline_id === filterPipeline
    const matchSource =
      filterSource === 'all' || lead.source === filterSource

    return matchSearch && matchPipeline && matchSource
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Buscar por nome, email, tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterPipeline} onValueChange={setFilterPipeline}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Pipeline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os pipelines</SelectItem>
            {pipelines.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Pipeline / Estágio</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Data</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhum lead encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.title}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {lead.email && <div>{lead.email}</div>}
                      {lead.phone && (
                        <div className="text-muted-foreground">{lead.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {(() => {
                        const s = Array.isArray(lead.stages) ? lead.stages[0] : lead.stages
                        return `${pipelines.find((p) => p.id === s?.pipeline_id)?.name || '-'} / ${s?.name || '-'}`
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{lead.source}</Badge>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const p = Array.isArray(lead.profiles) ? lead.profiles[0] : lead.profiles
                      return (p as { name?: string } | null)?.name || '-'
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {(lead.lead_tags || []).slice(0, 3).map((t) => (
                        <Badge key={t.tag} variant="secondary" className="text-xs">
                          {t.tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={`/pipelines/${
                          (Array.isArray(lead.stages) ? lead.stages[0] : lead.stages)?.pipeline_id || ''
                        }`}
                      >
                        Ver
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
