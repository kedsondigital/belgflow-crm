#!/usr/bin/env node
/**
 * Injeta variáveis de ambiente e inicia o servidor.
 * Cria .env.production.local e repassa env ao processo Node (Easypanel não repassa ao filho).
 */

import { readdir, readFile, writeFile } from 'fs/promises'
import { execSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('Erro: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY devem estar definidos no Easypanel (aba Environment)')
  process.exit(1)
}

async function replaceInFile(filePath) {
  let content = await readFile(filePath, 'utf8')
  const orig = content
  content = content.replace(/__NEXT_PUBLIC_SUPABASE_URL__/g, SUPABASE_URL)
  content = content.replace(/__NEXT_PUBLIC_SUPABASE_ANON_KEY__/g, SUPABASE_ANON)
  content = content.replace(/__NEXT_PUBLIC_SITE_URL__/g, SITE_URL || '')
  if (content !== orig) {
    await writeFile(filePath, content)
  }
}

async function processDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const ent of entries) {
    const full = join(dir, ent.name)
    if (ent.isDirectory()) {
      await processDir(full)
    } else if (ent.name.endsWith('.js')) {
      await replaceInFile(full)
    }
  }
}

async function main() {
  console.log('Injectando variáveis de ambiente...')

  // 1. Substitui placeholders nos arquivos .next (client bundle)
  await processDir(join(rootDir, '.next'))

  // 1.1 Substitui placeholders no server.js (standalone)
  try {
    await replaceInFile(join(rootDir, 'server.js'))
  } catch {
    // ignore se não existir
  }

  // 2. Cria .env.production.local (Next.js carrega automaticamente ao iniciar)
  const envContent = [
    `NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON}`,
    `NEXT_PUBLIC_SITE_URL=${SITE_URL || SUPABASE_URL}`,
    `SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE}`,
    ...(process.env.N8N_INGEST_TOKEN ? [`N8N_INGEST_TOKEN=${process.env.N8N_INGEST_TOKEN}`] : []),
    ...(process.env.N8N_DEDUPE_FIELD ? [`N8N_DEDUPE_FIELD=${process.env.N8N_DEDUPE_FIELD}`] : []),
  ].join('\n')
  await writeFile(join(rootDir, '.env.production.local'), envContent)

  console.log('Variáveis injetadas. Iniciando servidor...')

  const serverEnv = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_ANON,
    NEXT_PUBLIC_SITE_URL: SITE_URL || SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: SERVICE_ROLE,
    NODE_ENV: 'production',
    PORT: process.env.PORT || '3000',
    HOSTNAME: process.env.HOSTNAME || '0.0.0.0',
  }
  execSync('node server.js', { stdio: 'inherit', cwd: rootDir, env: serverEnv })
}

main().catch((err) => {
  console.error('Erro ao injetar env:', err)
  process.exit(1)
})
