#!/usr/bin/env node
/**
 * Injeta variáveis de ambiente e inicia o servidor.
 * Usa um script shell para garantir que as vars cheguem ao processo Node.
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

function escapeSh(val) {
  return String(val).replace(/'/g, "'\"'\"'")
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

  // 2. Escreve script shell em .next/ ( temos permissão) que exporta vars e inicia o servidor
  const runSh = `#!/bin/sh
export NEXT_PUBLIC_SUPABASE_URL='${escapeSh(SUPABASE_URL)}'
export NEXT_PUBLIC_SUPABASE_ANON_KEY='${escapeSh(SUPABASE_ANON)}'
export NEXT_PUBLIC_SITE_URL='${escapeSh(SITE_URL || SUPABASE_URL)}'
export SUPABASE_SERVICE_ROLE_KEY='${escapeSh(SERVICE_ROLE)}'
export NODE_ENV=production
export PORT="${process.env.PORT || '3000'}"
export HOSTNAME="${process.env.HOSTNAME || '0.0.0.0'}"
exec node server.js
`
  const runShPath = join(rootDir, '.next', 'run-server.sh')
  await writeFile(runShPath, runSh, { mode: 0o755 })

  console.log('Variáveis injetadas. Iniciando servidor...')

  execSync('sh .next/run-server.sh', {
    stdio: 'inherit',
    cwd: rootDir,
    env: { ...process.env, PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin' },
  })
}

main().catch((err) => {
  console.error('Erro ao injetar env:', err)
  process.exit(1)
})
