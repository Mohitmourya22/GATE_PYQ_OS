import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { loadDataset } from './data'
import { useAuth } from './auth'
import type { Attempt, Bookmark, Dataset, Question } from './types'

export const useDataset = () =>
  useQuery<Dataset>({ queryKey: ['dataset'], queryFn: loadDataset, staleTime: Infinity })

export function useAttempts() {
  const { repo, ownerKey } = useAuth()
  return useQuery({ queryKey: ['attempts', ownerKey], queryFn: () => repo.getAttempts() })
}

export function useAddAttempts() {
  const { repo, ownerKey } = useAuth(); const qc = useQueryClient()
  return useMutation({
    mutationFn: (rows: Omit<Attempt, 'id' | 'attempted_at'>[]) => repo.addAttempts(rows),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attempts', ownerKey] })
  })
}

export function useClearAttempts() {
  const { repo, ownerKey } = useAuth(); const qc = useQueryClient()
  return useMutation({ mutationFn: () => repo.clearAttempts(), onSuccess: () => qc.invalidateQueries({ queryKey: ['attempts', ownerKey] }) })
}

export function useBookmarks() {
  const { repo, ownerKey } = useAuth()
  return useQuery({ queryKey: ['bookmarks', ownerKey], queryFn: () => repo.getBookmarks() })
}

export function useSaveBookmark() {
  const { repo, ownerKey } = useAuth(); const qc = useQueryClient()
  return useMutation({ mutationFn: (b: Bookmark) => repo.saveBookmark(b), onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks', ownerKey] }) })
}

export function useRemoveBookmark() {
  const { repo, ownerKey } = useAuth(); const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => repo.removeBookmark(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks', ownerKey] }) })
}

export type Status = 'unattempted' | 'correct' | 'incorrect'

/** Latest attempt per question decides its status. */
export function statusMap(attempts: Attempt[] | undefined): Record<string, Status> {
  const latest: Record<string, Attempt> = {}
  for (const a of attempts ?? []) if (!latest[a.question_id] || a.attempted_at >= latest[a.question_id].attempted_at) latest[a.question_id] = a
  return Object.fromEntries(Object.entries(latest).map(([k, a]) => [k, a.is_correct ? 'correct' : 'incorrect'])) as Record<string, Status>
}

export const byId = (qs: Question[]) => Object.fromEntries(qs.map(q => [q.id, q])) as Record<string, Question>
