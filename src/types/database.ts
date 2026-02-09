export type RoleGlobal = 'ADMIN' | 'MEMBER'
export type PipelineRole = 'admin' | 'member'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type LeadOutcome = 'open' | 'won' | 'lost'
export type ActivityType = 'stage_change' | 'assignee_change' | 'field_edit' | 'note_added' | 'tag_added' | 'tag_removed' | 'created'

export interface Profile {
  id: string
  name: string | null
  email: string
  role_global: RoleGlobal
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Pipeline {
  id: string
  name: string
  description: string | null
  created_by: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface PipelineMember {
  id: string
  pipeline_id: string
  user_id: string
  role_in_pipeline: PipelineRole
  created_at: string
}

export interface Stage {
  id: string
  pipeline_id: string
  name: string
  position: number
  created_at: string
}

export interface Lead {
  id: string
  pipeline_id: string
  stage_id: string
  title: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  website: string | null
  source: string
  assignee_user_id: string | null
  notes: string | null
  outcome: LeadOutcome
  position: number
  created_at: string
  updated_at: string
}

export interface LeadTag {
  id: string
  lead_id: string
  tag: string
  created_at: string
}

export interface LeadActivity {
  id: string
  lead_id: string
  type: ActivityType
  payload: Record<string, unknown> | null
  created_at: string
  created_by: string | null
}

export interface Task {
  id: string
  lead_id: string
  title: string
  description: string | null
  due_date: string | null
  status: TaskStatus
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export interface PipelineWithStages extends Pipeline {
  stages: Stage[]
}

export interface LeadWithRelations extends Lead {
  lead_tags: LeadTag[]
  assignee?: Profile | null
}

export interface StageWithLeads extends Stage {
  leads: LeadWithRelations[]
}
