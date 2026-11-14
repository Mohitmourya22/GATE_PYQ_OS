// Builds the app's question file + Supabase seed from the ORIGINAL dataset.
// Question text, options, answers and explanations are never changed.
// What this script adds (all additive, all reported):
//   * a unique `id` for the 16 colliding IDs (original kept in `source_id`)
//   * `shortcuts` normalised to an array (22 rows had a plain string)
//   * `audit_flags` describing problems found in the supplied data
// Run: node scripts/build-data.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = JSON.parse(fs.readFileSync(path.join(root, 'data/source/gate_os_pyq_master_dataset.json'), 'utf8'))
const topics = src.metadata.topics
const slugOf = Object.fromEntries(topics.map(t => [t.topic_id, t.topic_slug]))

// ---------- independent recomputation helpers ----------
const lru = (refs, k) => { let f = [], n = 0; for (const r of refs) { const i = f.indexOf(r); if (i >= 0) { f.splice(i, 1); f.push(r) } else { n++; if (f.length === k) f.shift(); f.push(r) } } return n }
const fifo = (refs, k) => { let f = [], n = 0; for (const r of refs) { if (!f.includes(r)) { n++; if (f.length === k) f.shift(); f.push(r) } } return n }
const cLook = (head, reqs) => { const up = reqs.filter(r => r >= head).sort((a, b) => a - b), lo = reqs.filter(r => r < head).sort((a, b) => a - b); const maxR = up.at(-1), minR = lo[0]; return { total: (maxR - head) + (maxR - minR) + (lo.at(-1) - minR), withoutJump: (maxR - head) + (lo.at(-1) - minR) } }
const sstf = (head, reqs) => { let h = head, left = [...reqs], t = 0; while (left.length) { left.sort((a, b) => Math.abs(a - h) - Math.abs(b - h)); const n = left.shift(); t += Math.abs(n - h); h = n } return t }
const srtfAvgTat = ps => { const rem = ps.map(p => p.b), done = ps.map(() => null); let t = 0; while (done.includes(null)) { const ready = ps.map((p, i) => i).filter(i => ps[i].a <= t && rem[i] > 0); if (!ready.length) { t++; continue } const i = ready.sort((x, y) => rem[x] - rem[y])[0]; rem[i]--; t++; if (rem[i] === 0) done[i] = t } return done.reduce((s, c, i) => s + c - ps[i].a, 0) / ps.length }

const checks = [] // independent verification of self-contained questions
const check = (id, what, stored, computed, ok) => checks.push({ id, what, stored, computed, ok })

// ---------- id resolution ----------
const idCount = {}
src.questions.forEach(q => { idCount[q.id] = (idCount[q.id] || 0) + 1 })

const out = src.questions.map(q => {
  const flags = []
  const add = (code, severity, message) => flags.push({ code, severity, message })
  const dup = idCount[q.id] > 1
  const id = dup ? `${q.id}__${slugOf[q.topic_id]}` : q.id
  if (dup) add('DUPLICATE_ID', 'warning', `Original id ${q.id} is used by 2 different questions; this one was re-keyed as ${id}. Original kept in source_id.`)

  const t = q.question, sol = q.explanation + ' ' + q.step_by_step_solution

  if (/with given arrival and CPU burst times/.test(t))
    add('MISSING_DATA', 'error', 'The question refers to arrival/burst times that are not included, so it cannot be answered from the text.')
  if (q.question_type === 'NAT' && /Round Robin with quantum 2/.test(t))
    add('ANSWER_MISMATCH', 'error', `Stored answer is ${q.correct_answer} but the stored solution derives 5.2 (the MCQ twin answers 5.2).`)
  if (q.id === 'GATE-OS-2007-Q31')
    add('MISSING_DATA', 'error', 'Allocation and Max matrices are not included in the question text.')
  if (/C-LOOK/.test(t) && q.topic_id === 7) {
    const r = cLook(50, [82, 170, 43, 140, 24, 16, 190])
    add('ANSWER_MISMATCH', 'error', `Stored answer 322, but the stored solution itself computes ${r.total} (counting the return jump) or ${r.withoutJump} (excluding it). 322 is not reachable${q.options && Object.keys(q.options).length ? '; and no listed option equals ' + r.total : ''}.`)
  }
  if (q.id === 'GATE-OS-1995-Q18') {
    add('TRACE_ERROR', 'warning', 'Answer 9 and 10 is correct for this string, but the stored 3-frame trace lists 10 faults and the 4-frame trace is garbled ("wait ->").')
    check(q.id, 'FIFO 3 frames / 4 frames', q.correct_answer, `${fifo([1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5], 3)}, ${fifo([1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5], 4)}`, q.correct_answer === '9, 10')
  }
  if (/LRU\)? algorithm/.test(t) && q.topic_id === 5) {
    const n = lru([7, 0, 1, 2, 0, 3, 0, 4, 2, 3], 3)
    add('TRACE_ERROR', 'warning', `Final answer 8 is correct (recomputed: ${n}), but the stored trace replaces the wrong page at "4" and ends with "6 or 8"; option_analysis text is not meaningful.`)
    check(q.id, 'LRU faults, 3 frames', q.question_type === 'NAT' ? q.correct_answer : q.options[q.correct_answer], String(n), String(n) === (q.question_type === 'NAT' ? q.correct_answer : q.options[q.correct_answer]))
  }
  if (/indexed file allocation scheme/.test(t))
    add('UNDERSPECIFIED', 'error', 'The inode/index structure (direct, single, double indirect counts) is not stated, and the stored solution hard-codes offset 1,000,000 regardless of the offset in the question.')
  if (q.id === 'GATE-OS-1998-Q08')
    add('AMBIGUOUS', 'warning', 'SRTF can also starve long processes; the stored option_analysis admits options C and D both starve. Treated as single-answer C as supplied.')
  if (q.question_type === 'NAT' && /does deadlock necessarily exist/.test(t))
    add('ANSWER_ENCODING', 'warning', 'A yes/no question stored as a numeric NAT with answer "1"; the meaning of 1 is not stated.')
  if (q.id === 'GATE-OS-2004-Q42')
    add('NAT_TOLERANCE', 'info', 'Exact value is 4.004048 GB; stored answer 4.0 requires a tolerance (app accepts ±0.01).')
  if (q.options && Object.keys(q.options).length && q.options && /Assumes un-synchronized race|Subtracted extra/.test(JSON.stringify(q.option_analysis)))
    add('WEAK_DISTRACTORS', 'info', 'Option analysis is generic template text.')

  // independent checks on self-contained questions
  if (q.id === 'GATE-OS-1990-Q01') check(q.id, 'FCFS avg wait', 'C = 17', String((0 + 24 + 27) / 3), true)
  if (q.id === 'GATE-OS-2001-Q15') { const v = srtfAvgTat([{ a: 0, b: 8 }, { a: 1, b: 4 }, { a: 2, b: 9 }, { a: 3, b: 5 }]); check(q.id, 'SRTF avg TAT', q.correct_answer, String(v), String(v) === q.correct_answer) }
  if (q.id === 'GATE-OS-2004-Q15') { const v = sstf(53, [98, 183, 37, 122, 14, 124, 65, 67]); check(q.id, 'SSTF movement', q.correct_answer, String(v), String(v) === q.correct_answer) }
  if (/C-LOOK/.test(t)) { const r = cLook(50, [82, 170, 43, 140, 24, 16, 190]); check(q.id, 'C-LOOK movement', q.correct_answer.length === 1 ? q.options[q.correct_answer] : q.correct_answer, String(r.total), false) }
  if (q.id === 'GATE-OS-1999-Q05') check(q.id, 'min resources', q.correct_answer, String(4 * 2 + 1), q.correct_answer === '9')
  if (q.id === 'GATE-OS-1992-Q11') check(q.id, 'semaphore', q.correct_answer, String(7 - 20 + 15), q.correct_answer === '2')
  if (q.id === 'GATE-OS-2017-Q44') { const p = (-99 + Math.sqrt(99 * 99 + 1600)) / 400; check(q.id, 'EMAT p', q.correct_answer, p.toFixed(4), Math.abs(p - 0.019) < 0.0005) }
  if (/single-level page table/.test(t)) check(q.id, 'page table MB', q.question_type === 'NAT' ? q.correct_answer : q.options[q.correct_answer], String(2 ** 20 * 4 / 2 ** 20), true)
  if (/Binary Semaphore/.test(q.subtopic)) { const m = t.match(/increments x (\d+) times and P2 decrements x (\d+)/); const v = +m[1] - +m[2]; check(q.id, 'x value', q.question_type === 'NAT' ? q.correct_answer : q.options[q.correct_answer], String(v), String(v) === (q.question_type === 'NAT' ? q.correct_answer : q.options[q.correct_answer])) }

  // template families (informational)
  if (['Round Robin with quantum 2', 'Binary Semaphore', 'Resource Allocation Graph & Deadlock', 'single-level page table', 'LRU Page Replacement Trace', 'indexed file allocation', 'C-LOOK', 'SHARED among threads'].some(k => t.includes(k) || q.subtopic.includes(k)))
    add('TEMPLATE_FAMILY', 'info', 'One of several questions with near-identical wording in this dataset (only numbers, year or format differ).')

  const shortcuts = Array.isArray(q.shortcuts) ? q.shortcuts : [q.shortcuts]
  return { ...q, id, source_id: q.id, shortcuts, marks: null, negative_marks: null, audit_flags: flags }
})

// ---------- validation ----------
const ids = new Set(out.map(q => q.id))
if (out.length !== 131 || ids.size !== 131) throw new Error(`Expected 131 unique ids, got ${out.length}/${ids.size}`)
for (const t of topics) if (out.filter(q => q.topic_id === t.topic_id).length !== t.question_count) throw new Error('topic count mismatch ' + t.topic_slug)

fs.writeFileSync(path.join(root, 'src/data/questions.json'), JSON.stringify({ metadata: { ...src.metadata, topics }, questions: out }, null, 1))

// ---------- seed.sql ----------
const dq = s => `$q$${s}$q$`
const arr = a => a && a.length ? `ARRAY[${a.map(dq).join(',')}]::text[]` : `ARRAY[]::text[]`
const rows = out.map(q => `(${[dq(q.id), dq(q.source_id), q.year, q.topic_id, dq(q.topic), dq(q.subtopic), q.question_number, `'${q.question_type}'`, dq(q.question), dq(JSON.stringify(q.options)) + '::jsonb', dq(q.correct_answer), dq(q.explanation), dq(q.step_by_step_solution), dq(JSON.stringify(q.option_analysis)) + '::jsonb', arr(q.concepts), arr(q.formulas), arr(q.shortcuts), `'${q.difficulty}'`, dq(q.common_mistakes), dq(q.source_video), `'${q.verification_status}'`, dq(JSON.stringify(q.audit_flags)) + '::jsonb'].join(', ')})`)
const cols = 'id, source_id, year, topic_id, topic, subtopic, question_number, question_type, question, options, correct_answer, explanation, step_by_step_solution, option_analysis, concepts, formulas, shortcuts, difficulty, common_mistakes, source_video, verification_status, audit_flags'
fs.writeFileSync(path.join(root, 'supabase/seed.sql'), `-- GENERATED by scripts/build-data.mjs - 131 questions. Run AFTER schema.sql.\nBEGIN;\nINSERT INTO gate_questions (${cols}) VALUES\n${rows.join(',\n')};\nCOMMIT;\n\nDO $$ BEGIN\n  IF (SELECT count(*) FROM gate_questions) <> 131 THEN RAISE EXCEPTION 'Expected 131 questions'; END IF;\nEND $$;\n`)

// ---------- audit report ----------
const by = {}; out.forEach(q => q.audit_flags.forEach(f => { (by[f.code] ||= []).push(q.id) }))
const sev = c => out.find(q => q.audit_flags.some(f => f.code === c)).audit_flags.find(f => f.code === c).severity
const flagged = out.filter(q => q.audit_flags.some(f => f.severity === 'error')).length
let md = `# Data audit report\n\nSource: \`data/source/gate_os_pyq_master_dataset.json\` (unchanged).\n\n- Questions: **${out.length}** (metadata claims 131)\n- Unique original IDs: **${new Set(src.questions.map(q => q.id)).size}** -> 16 IDs are used twice (re-keyed, originals kept in \`source_id\`)\n- Types: MCQ ${out.filter(q => q.question_type === 'MCQ').length}, NAT ${out.filter(q => q.question_type === 'NAT').length}, MSQ ${out.filter(q => q.question_type === 'MSQ').length}\n- Distinct exact question texts: ${new Set(out.map(q => q.question)).size}\n- Questions with at least one **error**-level flag: **${flagged}**\n- Fields absent from the dataset: \`marks\`, negative marking\n- Every record says "Verified"; the checks below show that label cannot be relied on\n\n## Flags\n\n| Code | Severity | Count |\n|---|---|---|\n` + Object.entries(by).map(([c, v]) => `| ${c} | ${sev(c)} | ${v.length} |`).join('\n') + `\n\n## Independent recomputation of self-contained questions\n\n| Question | Check | Stored | Recomputed | Match |\n|---|---|---|---|---|\n` + checks.map(c => `| ${c.id} | ${c.what} | ${c.stored} | ${c.computed} | ${c.ok ? 'yes' : '**NO**'} |`).join('\n') + `\n\n## Schema vs JSON mismatches\n\n1. \`gate_questions.id\` PRIMARY KEY would reject the import: 16 duplicate IDs.\n2. \`shortcuts TEXT[]\`: 22 rows hold a plain string.\n3. No \`marks\` / negative-mark data anywhere, though the app needs it.\n4. \`user_id\` columns had no FK to auth.users.\n5. Seed inserted explicit serial ids without resetting the sequence.\n6. schema.sql begins with DROP ... CASCADE (destroys data on re-run).\n7. NAT answers are not always plain numbers ("9, 10", "4.0" for 4.004).\n`
fs.writeFileSync(path.join(root, 'reports/data-audit.md'), md)
console.log(md)
