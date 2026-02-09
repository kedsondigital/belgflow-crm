'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Lead } from '@/types/database'

interface LeadCardPreviewProps {
  lead: Lead & {
    lead_tags?: { tag: string }[]
    profiles?: { name: string; email: string } | null
  }
}

export function LeadCardPreview({ lead }: LeadCardPreviewProps) {
  const tags = lead.lead_tags?.map((t) => t.tag) || []
  const assignee = lead.profiles

  return (
    <Card className="cursor-grabbing shadow-xl ring-2 ring-primary/20 rotate-2 scale-105">
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
        </div>
      </CardContent>
    </Card>
  )
}
