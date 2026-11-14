# Data audit report

Source: `data/source/gate_os_pyq_master_dataset.json` (unchanged).

- Questions: **131** (metadata claims 131)
- Unique original IDs: **115** -> 16 IDs are used twice (re-keyed, originals kept in `source_id`)
- Types: MCQ 66, NAT 63, MSQ 2
- Distinct exact question texts: 89
- Questions with at least one **error**-level flag: **40**
- Fields absent from the dataset: `marks`, negative marking
- Every record says "Verified"; the checks below show that label cannot be relied on

## Flags

| Code | Severity | Count |
|---|---|---|
| AMBIGUOUS | warning | 1 |
| MISSING_DATA | error | 17 |
| ANSWER_MISMATCH | error | 19 |
| TEMPLATE_FAMILY | info | 115 |
| WEAK_DISTRACTORS | info | 12 |
| DUPLICATE_ID | warning | 32 |
| ANSWER_ENCODING | warning | 8 |
| TRACE_ERROR | warning | 22 |
| NAT_TOLERANCE | info | 1 |
| UNDERSPECIFIED | error | 12 |

## Independent recomputation of self-contained questions

| Question | Check | Stored | Recomputed | Match |
|---|---|---|---|---|
| GATE-OS-1990-Q01 | FCFS avg wait | C = 17 | 17 | yes |
| GATE-OS-2001-Q15 | SRTF avg TAT | 13 | 13 | yes |
| GATE-OS-1992-Q11 | semaphore | 2 | 2 | yes |
| GATE-OS-1996-Q04 | x value | 1 | 1 | yes |
| GATE-OS-1997-Q05 | x value | 1 | 1 | yes |
| GATE-OS-1998-Q06 | x value | 1 | 1 | yes |
| GATE-OS-1999-Q07 | x value | 1 | 1 | yes |
| GATE-OS-2000-Q08 | x value | 1 | 1 | yes |
| GATE-OS-2001-Q09 | x value | 1 | 1 | yes |
| GATE-OS-2002-Q10 | x value | 1 | 1 | yes |
| GATE-OS-2003-Q11 | x value | 1 | 1 | yes |
| GATE-OS-2004-Q12 | x value | 1 | 1 | yes |
| GATE-OS-2005-Q13 | x value | 1 | 1 | yes |
| GATE-OS-2006-Q14 | x value | 1 | 1 | yes |
| GATE-OS-2007-Q15 | x value | 1 | 1 | yes |
| GATE-OS-2008-Q16 | x value | 1 | 1 | yes |
| GATE-OS-2009-Q17 | x value | 1 | 1 | yes |
| GATE-OS-2010-Q18 | x value | 1 | 1 | yes |
| GATE-OS-2011-Q19 | x value | 1 | 1 | yes |
| GATE-OS-2012-Q20 | x value | 1 | 1 | yes |
| GATE-OS-2013-Q21 | x value | 1 | 1 | yes |
| GATE-OS-2014-Q22 | x value | 1 | 1 | yes |
| GATE-OS-2015-Q23 | x value | 1 | 1 | yes |
| GATE-OS-2016-Q24 | x value | 1 | 1 | yes |
| GATE-OS-2017-Q25 | x value | 1 | 1 | yes |
| GATE-OS-2018-Q26 | x value | 1 | 1 | yes |
| GATE-OS-2019-Q27 | x value | 1 | 1 | yes |
| GATE-OS-2020-Q28 | x value | 1 | 1 | yes |
| GATE-OS-1999-Q05 | min resources | 9 | 9 | yes |
| GATE-OS-1999-Q02 | page table MB | 4.0 | 4 | yes |
| GATE-OS-2000-Q03 | page table MB | 4 MB | 4 | yes |
| GATE-OS-2001-Q04 | page table MB | 4.0 | 4 | yes |
| GATE-OS-2002-Q05 | page table MB | 4 MB | 4 | yes |
| GATE-OS-2003-Q06 | page table MB | 4.0 | 4 | yes |
| GATE-OS-2004-Q07 | page table MB | 4 MB | 4 | yes |
| GATE-OS-2005-Q08 | page table MB | 4.0 | 4 | yes |
| GATE-OS-2006-Q09 | page table MB | 4 MB | 4 | yes |
| GATE-OS-2007-Q10 | page table MB | 4.0 | 4 | yes |
| GATE-OS-2008-Q11 | page table MB | 4 MB | 4 | yes |
| GATE-OS-1995-Q18 | FIFO 3 frames / 4 frames | 9, 10 | 9, 10 | yes |
| GATE-OS-2017-Q44 | EMAT p | 0.019 | 0.0194 | yes |
| GATE-OS-2002-Q03 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2003-Q04 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2004-Q05 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2005-Q06 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2006-Q07 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2007-Q08 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2008-Q09 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2009-Q10 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2010-Q11 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2011-Q12 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2012-Q13 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2013-Q14 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2014-Q15 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2015-Q16 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2016-Q17 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2017-Q18 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2018-Q19 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2019-Q20 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2020-Q21 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2021-Q22 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2022-Q23 | LRU faults, 3 frames | 8 | 8 | yes |
| GATE-OS-2004-Q15 | SSTF movement | 236 | 236 | yes |
| GATE-OS-2008-Q02 | C-LOOK movement | 322 | 341 | **NO** |
| GATE-OS-2009-Q03 | C-LOOK movement | 322 | 341 | **NO** |
| GATE-OS-2010-Q04 | C-LOOK movement | 322 | 341 | **NO** |
| GATE-OS-2011-Q05 | C-LOOK movement | 322 | 341 | **NO** |
| GATE-OS-2012-Q06 | C-LOOK movement | 322 | 341 | **NO** |
| GATE-OS-2013-Q07 | C-LOOK movement | 322 | 341 | **NO** |
| GATE-OS-2014-Q08 | C-LOOK movement | 322 | 341 | **NO** |
| GATE-OS-2015-Q09 | C-LOOK movement | 322 | 341 | **NO** |
| GATE-OS-2016-Q10 | C-LOOK movement | 322 | 341 | **NO** |
| GATE-OS-2017-Q11 | C-LOOK movement | 322 | 341 | **NO** |
| GATE-OS-2018-Q12 | C-LOOK movement | 322 | 341 | **NO** |

## Schema vs JSON mismatches

1. `gate_questions.id` PRIMARY KEY would reject the import: 16 duplicate IDs.
2. `shortcuts TEXT[]`: 22 rows hold a plain string.
3. No `marks` / negative-mark data anywhere, though the app needs it.
4. `user_id` columns had no FK to auth.users.
5. Seed inserted explicit serial ids without resetting the sequence.
6. schema.sql begins with DROP ... CASCADE (destroys data on re-run).
7. NAT answers are not always plain numbers ("9, 10", "4.0" for 4.004).
