import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formata valor numérico como moeda (EUR - Bélgica) */
export function formatCurrency(value: number | string | null | undefined): string {
  const n = value == null ? NaN : Number(value)
  if (Number.isNaN(n)) return ''
  return n.toLocaleString('nl-BE', { style: 'currency', currency: 'EUR' })
}

/** Extrai mensagem de erro do Supabase/Postgrest ou de Error genérico */
export function getErrorMessage(err: unknown, fallback = 'Ocorreu um erro'): string {
  if (!err) return fallback
  const e = err as { message?: string; details?: string; hint?: string; code?: string }
  const msg = e?.message || e?.details || e?.hint
  if (typeof msg === 'string' && msg.trim()) return msg.trim()
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string') return err
  return fallback
}
