'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import type { Lead } from '@/types/database'

interface LeadCardProps {
  lead: Lead & {
    lead_tags?: { tag: string }[]
    profiles?: { name: string; email: string } | null
  }
  onClick: () => void
  onDelete?: (leadId: string) => void
}

export function LeadCard({ lead, onClick, onDelete }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `lead-${lead.id}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const tags = lead.lead_tags?.map((t) => t.tag) || []
  const assignee = lead.profiles

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing mb-2 ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <p className="font-medium text-sm line-clamp-2">{lead.title}</p>
        {lead.email && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {lead.email}
          </p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        <div className="flex items-center justify-between mt-2 gap-2">
          <span className="text-xs text-muted-foreground truncate">{lead.source}</span>
          <div className="flex items-center gap-1.5 min-w-0">
            {assignee && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground truncate" title={assignee.name || assignee.email}>
                <Avatar className="size-5 shrink-0">
                  <AvatarFallback className="text-[10px]">
                    {assignee.name?.charAt(0) || assignee.email?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{assignee.name || assignee.email || '—'}</span>
              </span>
            )}
            {onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Excluir este lead?')) onDelete(lead.id)
                    }}
                  >
                    <Trash2 className="mr-2 size-3" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
