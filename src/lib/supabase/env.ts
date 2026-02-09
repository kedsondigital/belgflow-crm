import fs from 'fs'
import path from 'path'

let loaded = false

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

function ensureEnvLoaded() {
  if (loaded) return
  loaded = true
  const cwd = process.cwd()
  loadEnvFile(path.join(cwd, '.env.production.local'))
  loadEnvFile(path.join(cwd, '.env.local'))
}

export function getEnv(name: string) {
  if (process.env[name]) return process.env[name]
  ensureEnvLoaded()
  return process.env[name]
}
