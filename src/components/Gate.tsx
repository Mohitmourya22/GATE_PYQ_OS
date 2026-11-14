import type { ReactNode } from 'react'
import { useDataset } from '../lib/hooks'
import type { Dataset } from '../lib/types'

/** Waits for the question dataset, then renders children with it. */
export default function Gate({ children }: { children: (ds: Dataset) => ReactNode }) {
  const { data, isLoading, error } = useDataset()
  if (isLoading) return <div className="py-24 text-center text-muted">Loading questions…</div>
  if (error || !data) return <div className="card text-bad">Could not load the question bank.</div>
  return <>{children(data)}</>
}

export const Stat = ({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) => (
  <div className="card">
    <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
    <div className="mt-1 text-3xl font-extrabold">{value}</div>
    {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
  </div>
)

export const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0)
