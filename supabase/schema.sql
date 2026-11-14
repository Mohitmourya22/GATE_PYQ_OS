-- ====================================================================
-- GATE OS PYQ - Supabase schema (revised from the supplied schema)
-- Run this FIRST in Supabase > SQL Editor, then run seed.sql.
-- Safe to re-run: it does NOT drop existing tables or user data.
-- Changes vs the supplied file are marked "CHANGED".
-- ====================================================================

DO $$ BEGIN CREATE TYPE question_type_enum AS ENUM ('MCQ', 'MSQ', 'NAT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE difficulty_enum AS ENUM ('Easy', 'Medium', 'Hard'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE verification_status_enum AS ENUM ('Verified', 'Needs Verification'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS os_topics (
    id SERIAL PRIMARY KEY,
    topic_slug VARCHAR(100) NOT NULL UNIQUE,
    topic_name VARCHAR(150) NOT NULL UNIQUE,
    subject VARCHAR(100) DEFAULT 'Operating Systems',
    question_count INT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gate_questions (
    id VARCHAR(80) PRIMARY KEY,               -- CHANGED: unique key (16 original ids were duplicated); widened to 80
    source_id VARCHAR(50) NOT NULL,           -- CHANGED: the id exactly as in the supplied JSON (not unique)
    year INT NOT NULL CHECK (year >= 1987 AND year <= 2026),
    subject VARCHAR(100) DEFAULT 'Operating Systems',
    topic_id INT NOT NULL REFERENCES os_topics(id) ON DELETE RESTRICT,
    topic VARCHAR(150) NOT NULL,
    subtopic VARCHAR(150),
    question_number INT NOT NULL,
    question_type question_type_enum NOT NULL,
    question TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT NOT NULL,
    step_by_step_solution TEXT NOT NULL,
    option_analysis JSONB,
    concepts TEXT[],
    formulas TEXT[],
    shortcuts TEXT[],                         -- seed wraps the 22 plain-string values into 1-element arrays
    difficulty difficulty_enum NOT NULL DEFAULT 'Medium',
    common_mistakes TEXT,
    source_video VARCHAR(255) NOT NULL,
    verification_status verification_status_enum DEFAULT 'Verified',  -- exactly as supplied
    audit_flags JSONB NOT NULL DEFAULT '[]'::jsonb,  -- CHANGED: problems found by scripts/build-data.mjs
    marks NUMERIC(3,1),                       -- CHANGED: NULL = not in dataset (see README)
    negative_marks NUMERIC(4,2),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,   -- CHANGED: FK added
    question_id VARCHAR(80) NOT NULL REFERENCES gate_questions(id) ON DELETE CASCADE,
    user_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    marks_obtained NUMERIC(4,2) NOT NULL,
    time_taken_seconds INT NOT NULL DEFAULT 0,
    mode TEXT NOT NULL DEFAULT 'practice',    -- CHANGED: 'practice' | 'mock'
    attempted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_bookmarks (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id VARCHAR(80) NOT NULL REFERENCES gate_questions(id) ON DELETE CASCADE,
    notes TEXT,
    is_difficult BOOLEAN NOT NULL DEFAULT FALSE,   -- CHANGED: "mark difficult"
    revision_list TEXT,                             -- CHANGED: optional list name
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_gate_questions_topic_id ON gate_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_gate_questions_year ON gate_questions(year);
CREATE INDEX IF NOT EXISTS idx_gate_questions_type ON gate_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_gate_questions_difficulty ON gate_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_gate_questions_source_id ON gate_questions(source_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON user_question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_question_id ON user_question_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_correct ON user_question_attempts(user_id, is_correct);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON user_bookmarks(user_id);

ALTER TABLE os_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to OS topics" ON os_topics;
CREATE POLICY "Allow public read access to OS topics" ON os_topics FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read access to GATE questions" ON gate_questions;
CREATE POLICY "Allow public read access to GATE questions" ON gate_questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage their own question attempts" ON user_question_attempts;
CREATE POLICY "Users can manage their own question attempts" ON user_question_attempts FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON user_bookmarks;
CREATE POLICY "Users can manage their own bookmarks" ON user_bookmarks FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO os_topics (id, topic_slug, topic_name, question_count, description) VALUES
(1, 'process-scheduling', 'Process Scheduling & CPU Management', 21, 'FCFS, SJF, SRTF, Round Robin, Priority Scheduling, Gantt Charts, and CPU utilization.'),
(2, 'process-synchronization', 'Process Synchronization & Semaphores', 28, 'Critical Section Problem, Peterson Solution, Semaphores, Producer-Consumer, and Race Conditions.'),
(3, 'deadlocks', 'Deadlocks & Resource Allocation', 18, 'Deadlock conditions, Resource Allocation Graphs, Banker Algorithm, and Safe Sequences.'),
(4, 'memory-management', 'Memory Management & Partitioning', 11, 'Contiguous Allocation, Paging, Segmentation, and Fragmentation.'),
(5, 'virtual-memory', 'Virtual Memory & Page Replacement', 23, 'Demand Paging, FIFO, LRU, Optimal Page Replacement, Belady Anomaly, and EMAT.'),
(6, 'file-systems', 'File Systems & Directory Indexing', 13, 'File Allocation Methods, Unix Inode, Pointer Capacity, and Max File Size.'),
(7, 'disk-scheduling', 'Disk Scheduling & Hardware IO', 12, 'FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK Disk Seek Algorithms.'),
(8, 'threads', 'Threads & Concurrency Models', 5, 'User-level vs Kernel-level Threads, Context Switch Time, and Shared Resources.')
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('os_topics', 'id'), (SELECT max(id) FROM os_topics));  -- CHANGED: sequence reset
