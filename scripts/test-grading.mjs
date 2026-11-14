// Tests grading against all 131 questions. Needs the TypeScript compiler only (no npm install of app deps).
//   node scripts/test-grading.mjs
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'grading-'))
const tscArgs = `${path.join(root, 'src/lib/grading.ts')} --outDir ${tmp} --module esnext --target es2020 --skipLibCheck --ignoreConfig`
try { execSync(`tsc ${tscArgs}`, { stdio: 'inherit' }) } catch { execSync(`npx tsc ${tscArgs}`, { stdio: 'inherit' }) }
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}')
const { grade } = await import(pathToFileURL(path.join(tmp, 'grading.js')).href)
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/questions.json'), 'utf8'))

let pass = 0, fail = 0
const bad = (m) => { fail++; console.log('FAIL', m) }
const ok = () => { pass++ }
const seen = new Set()
for (const q of data.questions) {
  if (seen.has(q.id)) bad('duplicate id ' + q.id); seen.add(q.id)
  // 1. stored answer must grade correct
  const g = grade(q, q.correct_answer)
  g.correct ? ok() : bad(`${q.id} stored answer rejected`)
  // 2. blank is unanswered, zero marks
  const b = grade(q, '  ');
  (!b.answered && b.marks === 0) ? ok() : bad(`${q.id} blank`)
  // 3. a wrong answer is wrong
  let wrong
  if (q.question_type === 'MCQ') wrong = Object.keys(q.options).find(k => k !== q.correct_answer)
  else if (q.question_type === 'MSQ') wrong = 'A'
  else wrong = '99999'
  const w = grade(q, wrong);
  (w.answered && !w.correct) ? ok() : bad(`${q.id} wrong answer accepted`)
  // 4. negative marking only for MCQ
  if (q.question_type === 'MCQ' && !(w.marks < 0)) bad(`${q.id} MCQ should be negative`)
  if (q.question_type !== 'MCQ' && w.marks !== 0) bad(`${q.id} non-MCQ must not be negative`)
}
// specific behaviours
const by = id => data.questions.find(q => q.id === id)
const t = (name, cond) => cond ? ok() : bad(name)
t('MSQ order-insensitive', grade(by('GATE-OS-2014-Q02'), 'D, a ,B').correct)
t('MSQ partial is wrong', !grade(by('GATE-OS-2014-Q02'), 'A,B').correct)
t('NAT 9, 10 pair', grade(by('GATE-OS-1995-Q18'), '9 10').correct && !grade(by('GATE-OS-1995-Q18'), '9').correct && !grade(by('GATE-OS-1995-Q18'), '10, 9').correct)
t('NAT tolerance 4.0 accepts 4.004', grade(by('GATE-OS-2004-Q42'), '4.004').correct)
t('NAT 0.019 accepts 0.0194, rejects 0.02', grade(by('GATE-OS-2017-Q44'), '0.0194').correct && !grade(by('GATE-OS-2017-Q44'), '0.02').correct)
t('NAT 236 rejects 237', !grade(by('GATE-OS-2004-Q15'), '237').correct)
t('NAT non-numeric rejected', !grade(by('GATE-OS-2004-Q15'), 'abc').correct)
t('Total 131 / unique ids', data.questions.length === 131 && seen.size === 131)
console.log(`\n${pass} checks passed, ${fail} failed across ${data.questions.length} questions`)
process.exit(fail ? 1 : 0)
