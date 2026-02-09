import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const IngestLeadSchema = z.object({
  pipeline_id: z.string().uuid(),
  title: z.string().min(1).max(500),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  phone_country_code: z.string().optional(),
  whatsapp: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  source: z.string().default('scrapping n8n'),
  notes: z.string().optional(),
  nacionalidade: z.string().optional(),
  resumo: z.string().optional(),
  valor: z.number().optional().or(z.string().transform((v) => v ? parseFloat(v) : undefined)),
  tags: z.array(z.string()).optional().default([]),
})

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '') || request.headers.get('x-api-key')

  const expectedToken = process.env.N8N_INGEST_TOKEN
  if (!expectedToken || token !== expectedToken) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing API token' },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const parseResult = IngestLeadSchema.safeParse(body)
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: 'Validation Error',
        message: parseResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const data = parseResult.data
  const supabase = createAdminClient()

  const { data: pipeline, error: pipelineError } = await supabase
    .from('pipelines')
    .select('id')
    .eq('id', data.pipeline_id)
    .eq('is_archived', false)
    .single()

  if (pipelineError || !pipeline) {
    return NextResponse.json(
      { error: 'Not Found', message: 'Pipeline not found or archived' },
      { status: 404 }
    )
  }

  const { data: stages } = await supabase
    .from('stages')
    .select('id')
    .eq('pipeline_id', data.pipeline_id)
    .order('position', { ascending: true })
    .limit(1)

  const entradaStage = stages?.[0]
  if (!entradaStage) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Pipeline has no stages' },
      { status: 400 }
    )
  }

  const dedupeField = process.env.N8N_DEDUPE_FIELD || 'email'
  if (dedupeField === 'email' && data.email) {
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('pipeline_id', data.pipeline_id)
      .eq('email', data.email)
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Lead with this email already exists in pipeline' },
        { status: 409 }
      )
    }
  } else if (dedupeField === 'phone' && data.phone) {
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('pipeline_id', data.pipeline_id)
      .eq('phone', data.phone)
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Lead with this phone already exists in pipeline' },
        { status: 409 }
      )
    }
  } else if (dedupeField === 'website' && data.website) {
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('pipeline_id', data.pipeline_id)
      .eq('website', data.website)
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Lead with this website already exists in pipeline' },
        { status: 409 }
      )
    }
  }

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .insert({
      pipeline_id: data.pipeline_id,
      stage_id: entradaStage.id,
      title: data.title,
      email: data.email || null,
      phone: data.phone || null,
      phone_country_code: data.phone ? (data.phone_country_code || '32') : null,
      whatsapp: data.whatsapp || null,
      website: data.website || null,
      source: data.source,
      notes: data.notes || null,
      nacionalidade: data.nacionalidade || null,
      resumo: data.resumo || null,
      valor: data.valor || null,
      position: 0,
    })
    .select()
    .single()

  if (leadError) {
    console.error('Ingest lead error:', leadError)
    return NextResponse.json(
      { error: 'Internal Error', message: 'Failed to create lead' },
      { status: 500 }
    )
  }

  if (data.tags && data.tags.length > 0) {
    await supabase.from('lead_tags').insert(
      data.tags.map((tag) => ({ lead_id: lead.id, tag }))
    )
  }

  await supabase.from('lead_activities').insert({
    lead_id: lead.id,
    type: 'created',
    payload: { source: data.source },
  })

  return NextResponse.json({
    success: true,
    lead: {
      id: lead.id,
      title: lead.title,
      pipeline_id: lead.pipeline_id,
      stage_id: lead.stage_id,
    },
  })
}
