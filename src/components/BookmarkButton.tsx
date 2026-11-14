import { Bookmark as Bm, Flag } from 'lucide-react'
import { useBookmarks, useRemoveBookmark, useSaveBookmark } from '../lib/hooks'

export default function BookmarkButton({ id, compact }: { id: string; compact?: boolean }) {
  const { data } = useBookmarks()
  const save = useSaveBookmark(); const remove = useRemoveBookmark()
  const cur = data?.find(b => b.question_id === id)

  const toggleSaved = () => cur
    ? remove.mutate(id)
    : save.mutate({ question_id: id, notes: '', is_difficult: false, revision_list: '', created_at: new Date().toISOString() })
  const toggleDifficult = () => save.mutate({
    question_id: id, notes: cur?.notes ?? '', revision_list: cur?.revision_list ?? '', created_at: cur?.created_at ?? new Date().toISOString(),
    is_difficult: !cur?.is_difficult
  })

  return (
    <div className="flex gap-2">
      <button className={`btn ${cur ? 'border-brand text-brand' : ''}`} onClick={toggleSaved} aria-pressed={!!cur} title="Save for revision">
        <Bm className={`h-4 w-4 ${cur ? 'fill-current' : ''}`} />{!compact && (cur ? 'Saved' : 'Bookmark')}
      </button>
      <button className={`btn ${cur?.is_difficult ? 'border-warn text-warn' : ''}`} onClick={toggleDifficult} aria-pressed={!!cur?.is_difficult} title="Mark as difficult (also bookmarks it)">
        <Flag className={`h-4 w-4 ${cur?.is_difficult ? 'fill-current' : ''}`} />{!compact && 'Difficult'}
      </button>
    </div>
  )
}
