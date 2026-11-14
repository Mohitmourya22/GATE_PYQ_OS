import { supabase } from './supabase'
import type { Attempt, Bookmark } from './types'

/** Where user progress lives. Local = this browser. Supabase = per-user rows protected by RLS. */
export interface Repo {
  getAttempts(): Promise<Attempt[]>
  addAttempts(a: Omit<Attempt, 'id' | 'attempted_at'>[]): Promise<void>
  clearAttempts(): Promise<void>
  getBookmarks(): Promise<Bookmark[]>
  saveBookmark(b: Bookmark): Promise<void>
  removeBookmark(questionId: string): Promise<void>
}

const read = <T,>(k: string): T[] => { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } }
const write = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v))
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random())

export const localRepo: Repo = {
  async getAttempts() { return read<Attempt>('gatepyq:attempts') },
  async addAttempts(rows) {
    const now = new Date().toISOString()
    write('gatepyq:attempts', [...read<Attempt>('gatepyq:attempts'), ...rows.map(r => ({ ...r, id: uid(), attempted_at: now }))])
  },
  async clearAttempts() { write('gatepyq:attempts', []) },
  async getBookmarks() { return read<Bookmark>('gatepyq:bookmarks') },
  async saveBookmark(b) {
    write('gatepyq:bookmarks', [...read<Bookmark>('gatepyq:bookmarks').filter(x => x.question_id !== b.question_id), b])
  },
  async removeBookmark(id) { write('gatepyq:bookmarks', read<Bookmark>('gatepyq:bookmarks').filter(x => x.question_id !== id)) }
}

export function supabaseRepo(userId: string): Repo {
  const db = supabase!
  return {
    async getAttempts() {
      const { data, error } = await db.from('user_question_attempts').select('*').eq('user_id', userId).order('attempted_at').range(0, 9999)
      if (error) throw error
      return (data ?? []).map((r: any) => ({ ...r, marks_obtained: Number(r.marks_obtained) })) as Attempt[]
    },
    async addAttempts(rows) {
      const { error } = await db.from('user_question_attempts').insert(rows.map(r => ({ ...r, user_id: userId })))
      if (error) throw error
    },
    async clearAttempts() {
      const { error } = await db.from('user_question_attempts').delete().eq('user_id', userId)
      if (error) throw error
    },
    async getBookmarks() {
      const { data, error } = await db.from('user_bookmarks').select('*').eq('user_id', userId)
      if (error) throw error
      return (data ?? []).map((r: any) => ({ ...r, notes: r.notes ?? '', revision_list: r.revision_list ?? '' })) as Bookmark[]
    },
    async saveBookmark(b) {
      const { error } = await db.from('user_bookmarks').upsert({ user_id: userId, question_id: b.question_id, notes: b.notes, is_difficult: b.is_difficult, revision_list: b.revision_list })
      if (error) throw error
    },
    async removeBookmark(id) {
      const { error } = await db.from('user_bookmarks').delete().eq('user_id', userId).eq('question_id', id)
      if (error) throw error
    }
  }
}
