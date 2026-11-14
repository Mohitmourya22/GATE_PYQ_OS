# Testing report

Environment note: this session had no network access for package installs, so `npm install`, `vite build` and the Supabase connection could **not** be run. Everything below states what was actually executed.

## Executed and passing

| Check | Result |
|---|---|
| Dataset import: 131 rows, 131 unique ids after re-keying, per-topic counts match metadata | pass (`node scripts/build-data.mjs`) |
| `seed.sql` generated with 131 row tuples, 0 duplicate ids, built-in row-count guard | pass (static check) |
| Grading, all 131 questions: stored answer accepted; blank = unanswered/0; a wrong answer rejected; negative marks only for MCQ | pass – 401 checks (`npm test`) |
| Grading edge cases: MSQ order-insensitive and all-or-nothing; NAT pair "9, 10"; NAT decimal tolerance (4.0 accepts 4.004; 0.019 accepts 0.0194, rejects 0.02); non-numeric rejected | pass |
| Independent recomputation of self-contained questions (FCFS, SRTF, SSTF, semaphore, deadlock bound, page-table size, FIFO/LRU, EMAT, binary-semaphore family) | pass; C-LOOK family **fails** – see audit |
| All 26 `.ts/.tsx` files parse with no syntax errors | pass |

## NOT executed (please run on your machine)

- `npm install && npm run build` (TypeScript type-check of the React code against real React/Supabase types)
- Visual/responsive checks and click-through of every page in a browser
- Running `schema.sql` / `seed.sql` on a live Supabase project (no Postgres server was available)
- Supabase sign-in, RLS behaviour, Vercel deployment

The React pages were written carefully but have never been compiled or rendered, so expect to fix a few type or layout errors on first build. Send me the error output and I will fix them.
