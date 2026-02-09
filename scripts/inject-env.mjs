#!/usr/bin/env node
/**
 * Substitui placeholders nos arquivos do build pelas variáveis de ambiente em runtime.
 * Necessário porque o Easypanel não passa env como build-arg ao Docker.
 */

import { readdir, readFile, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || SUPABASE_URL

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

try {
  console.log('Injectando variáveis de ambiente...')
  await processDir(join(__dirname, '..', '.next'))
  console.log('Variáveis injetadas. Iniciando servidor...')
} catch (err) {
  console.error('Erro ao injetar env:', err)
  process.exit(1)
}
