import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
  valor: z.union([z.string(), z.number().transform(String)]).optional(),
  tags: z.array(z.string()).optional().default([]),
  linkedin: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  nome_dono: z.string().optional(),
  email_dono: z.string().email().optional().or(z.literal('')),
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

  const pipeline = await prisma.pipeline.findFirst({
    where: { id: data.pipeline_id, isArchived: false },
  })

  if (!pipeline) {
    return NextResponse.json(
      { error: 'Not Found', message: 'Pipeline not found or archived' },
      { status: 404 }
    )
  }

  const entradaStage = await prisma.stage.findFirst({
    where: { pipelineId: data.pipeline_id },
    orderBy: { position: 'asc' },
  })

  if (!entradaStage) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Pipeline has no stages' },
      { status: 400 }
    )
  }

  const dedupeField = process.env.N8N_DEDUPE_FIELD || 'email'
  if (dedupeField === 'email' && data.email) {
    const existing = await prisma.lead.findFirst({
      where: { pipelineId: data.pipeline_id, email: data.email },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Lead with this email already exists in pipeline' },
        { status: 409 }
      )
    }
  } else if (dedupeField === 'phone' && data.phone) {
    const existing = await prisma.lead.findFirst({
      where: { pipelineId: data.pipeline_id, phone: data.phone },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Lead with this phone already exists in pipeline' },
        { status: 409 }
      )
    }
  } else if (dedupeField === 'website' && data.website) {
    const existing = await prisma.lead.findFirst({
      where: { pipelineId: data.pipeline_id, website: data.website },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Lead with this website already exists in pipeline' },
        { status: 409 }
      )
    }
  }

  try {
    const lead = await prisma.lead.create({
      data: {
        pipelineId: data.pipeline_id,
        stageId: entradaStage.id,
        title: data.title,
        email: data.email || null,
        phone: data.phone || null,
        phoneCountryCode: data.phone ? (data.phone_country_code || '32') : null,
        whatsapp: data.whatsapp || null,
        website: data.website || null,
        source: data.source,
        notes: data.notes || null,
        nacionalidade: data.nacionalidade || null,
        resumo: data.resumo || null,
        valor: data.valor ? String(data.valor) : null,
        linkedin: data.linkedin || null,
        facebook: data.facebook || null,
        instagram: data.instagram || null,
        nomeDono: data.nome_dono || null,
        emailDono: data.email_dono || null,
        position: 0,
      },
    })

    if (data.tags && data.tags.length > 0) {
      await prisma.leadTag.createMany({
        data: data.tags.map((tag) => ({ leadId: lead.id, tag })),
      })
    }

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'created',
        payload: { source: data.source },
      },
    })

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        title: lead.title,
        pipeline_id: lead.pipelineId,
        stage_id: lead.stageId,
      },
    })
  } catch (err) {
    console.error('Ingest lead error:', err)
    return NextResponse.json(
      { error: 'Internal Error', message: 'Failed to create lead' },
      { status: 500 }
    )
  }
}
