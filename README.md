# GATE CS – Operating Systems PYQ Platform

React + Vite + TypeScript + Tailwind + TanStack Query + Recharts + Supabase.
All 131 supplied questions are bundled, so the app works **offline with no setup**; Supabase adds accounts and synced progress.

## 1. Run it on your computer (no Supabase needed)

1. Install Node.js 20+ from https://nodejs.org (LTS).
2. Open a terminal in this folder and run:
   ```
   npm install
   npm run dev
   ```
3. Open the address it prints (usually http://localhost:5173).

Other commands: `npm run build` (type-check + production build), `npm test` (grading tests on all 131 questions), `npm run data` (rebuilds `src/data/questions.json`, `supabase/seed.sql` and `reports/data-audit.md` from `data/source/`).

## 2. Set up Supabase (optional, enables sign-in + synced progress)

1. Create a free project at https://supabase.com.
2. **SQL Editor → New query**: paste all of `supabase/schema.sql` → Run.
3. New query again: paste all of `supabase/seed.sql` → Run. It stops with an error unless exactly 131 questions were inserted.
4. **Project Settings → API**: copy the *Project URL* and the *anon public* key.
5. Copy `.env.example` to `.env` and paste the two values. Never use the `service_role` key here.
6. Authentication → Providers → Email is on by default. For quick testing, turn off "Confirm email".
7. Restart `npm run dev`. Use **Sign in** (top right) to create an account.

Without the two env values the app silently uses the bundled JSON and browser storage.
If Supabase is configured but returns anything other than 131 questions, the app falls back to the bundled data and logs a console warning.

## 3. Deploy to Vercel

1. Push this folder to a GitHub repository (`.env` is git-ignored).
2. https://vercel.com → Add New Project → import the repo (Framework preset: Vite).
3. Settings → Environment Variables: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Deploy. `vercel.json` already rewrites all routes to `index.html`.
5. In Supabase → Authentication → URL Configuration, add your Vercel URL as the Site URL.

## Decisions you should know about

- **Duplicate IDs.** 16 IDs were used by two different questions (a Deadlock one and a Virtual-Memory one). Both were re-keyed `ORIGINALID__topic-slug`; the original is kept in `source_id`.
- **No marks in the dataset.** Every question is scored as 1 mark (MCQ −1/3 if wrong; MSQ/NAT no negative) and labelled "assumed". To use real marks, fill `marks` / `negative_marks` (database columns or `questions.json`) – the app uses them automatically.
- **Known-bad questions are labelled, never edited.** 40 questions have error-level issues (missing data, conflicting answers). They are shown with a warning, listed under *Data notes*, and excluded from mock tests unless you tick "Include questions with known data issues".
- **LaTeX.** The dataset contains no `$...$` math markup; text is shown verbatim. Anything written as `$...$` is typeset with KaTeX.
- Full details: `reports/data-audit.md`, `reports/testing-report.md`.
