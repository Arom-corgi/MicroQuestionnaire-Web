import { z } from 'zod'
import type { Answers, Survey } from '../models/questionnaire'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
export function browserStorage(kind: 'localStorage' | 'sessionStorage'): StorageLike | null {
  try { return typeof window === 'undefined' ? null : window[kind] } catch { return null }
}
const draftSchema = z.object({
  versionId: z.string(), savedAt: z.number(),
  answers: z.record(z.string(), z.union([z.string(), z.number().finite(), z.array(z.string())])),
})
const TTL = 7 * 24 * 60 * 60 * 1000
export class DraftStore {
  private storage: StorageLike | null
  constructor(storage: StorageLike | null = browserStorage('localStorage')) { this.storage = storage }
  private key(survey: Survey, identity: string): string { return `mq-web:draft:${identity}:${survey.id}` }
  read(survey: Survey, identity: string): { answers: Answers; savedAt: number } | null {
    try {
      const value = draftSchema.safeParse(JSON.parse(this.storage?.getItem(this.key(survey, identity)) ?? 'null'))
      if (!value.success) return null
      if (value.data.versionId !== survey.current_version.id || Date.now() - value.data.savedAt > TTL) {
        this.clear(survey, identity)
        return null
      }
      return value.data
    } catch { return null }
  }
  save(survey: Survey, identity: string, answers: Answers): boolean {
    if (!this.storage) return false
    try {
      this.storage.setItem(this.key(survey, identity), JSON.stringify({
        versionId: survey.current_version.id, savedAt: Date.now(), answers,
      }))
      return true
    } catch { return false }
  }
  clear(survey: Survey, identity: string): boolean {
    try { this.storage?.removeItem(this.key(survey, identity)); return true } catch { return false }
  }
}

export function createClientId(storage: StorageLike | null = browserStorage('localStorage')): string {
  try {
    const saved = storage?.getItem('mq-web:client-id')
    if (saved && /^[a-zA-Z0-9-]{16,80}$/.test(saved)) return saved
  } catch { /* Keep a stable in-memory ID for the current page. */ }
  const id = crypto.randomUUID()
  try { storage?.setItem('mq-web:client-id', id) } catch { /* Storage may be disabled. */ }
  return id
}
