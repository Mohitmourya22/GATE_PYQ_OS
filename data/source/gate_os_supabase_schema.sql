-- ====================================================================
-- GATE COMPUTER SCIENCE OPERATING SYSTEMS PYQ DATABASE SCHEMA
-- Target Engine: PostgreSQL / Supabase
-- Description: Production-ready DDL schema with custom types, tables,
--              foreign key constraints, indexes, and RLS policies.
-- ====================================================================

-- 1. DROP EXISTING TABLES IF NEEDED
DROP TABLE IF EXISTS user_bookmarks CASCADE;
DROP TABLE IF EXISTS user_question_attempts CASCADE;
DROP TABLE IF EXISTS gate_questions CASCADE;
DROP TABLE IF EXISTS os_topics CASCADE;

DROP TYPE IF EXISTS question_type_enum CASCADE;
DROP TYPE IF EXISTS difficulty_enum CASCADE;
DROP TYPE IF EXISTS verification_status_enum CASCADE;

-- 2. CREATE ENUMS
CREATE TYPE question_type_enum AS ENUM ('MCQ', 'MSQ', 'NAT');
CREATE TYPE difficulty_enum AS ENUM ('Easy', 'Medium', 'Hard');
CREATE TYPE verification_status_enum AS ENUM ('Verified', 'Needs Verification');

-- 3. CREATE TOPICS TABLE
CREATE TABLE os_topics (
    id SERIAL PRIMARY KEY,
    topic_slug VARCHAR(100) NOT NULL UNIQUE,
    topic_name VARCHAR(150) NOT NULL UNIQUE,
    subject VARCHAR(100) DEFAULT 'Operating Systems',
    question_count INT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CREATE MASTER QUESTION BANK TABLE
CREATE TABLE gate_questions (
    id VARCHAR(50) PRIMARY KEY, -- e.g., GATE-OS-2004-Q42
    year INT NOT NULL CHECK (year >= 1987 AND year <= 2026),
    subject VARCHAR(100) DEFAULT 'Operating Systems',
    topic_id INT NOT NULL REFERENCES os_topics(id) ON DELETE RESTRICT,
    topic VARCHAR(150) NOT NULL,
    subtopic VARCHAR(150),
    question_number INT NOT NULL,
    question_type question_type_enum NOT NULL,
    question TEXT NOT NULL,
    options JSONB, -- e.g., {"A": "...", "B": "..."} for MCQ/MSQ, empty object for NAT
    correct_answer TEXT NOT NULL,
    explanation TEXT NOT NULL,
    step_by_step_solution TEXT NOT NULL,
    option_analysis JSONB,
    concepts TEXT[],
    formulas TEXT[],
    shortcuts TEXT[],
    difficulty difficulty_enum NOT NULL DEFAULT 'Medium',
    common_mistakes TEXT,
    source_video VARCHAR(255) NOT NULL,
    verification_status verification_status_enum DEFAULT 'Verified',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CREATE USER ATTEMPTS & ANALYTICS TABLE
CREATE TABLE user_question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    question_id VARCHAR(50) NOT NULL REFERENCES gate_questions(id) ON DELETE CASCADE,
    user_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    marks_obtained NUMERIC(4,2) NOT NULL, -- e.g., +1.00, +2.00, -0.33, -0.66
    time_taken_seconds INT NOT NULL DEFAULT 0,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. CREATE USER BOOKMARKS TABLE
CREATE TABLE user_bookmarks (
    user_id UUID NOT NULL,
    question_id VARCHAR(50) NOT NULL REFERENCES gate_questions(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, question_id)
);

-- 7. PERFORMANCE INDEXES
CREATE INDEX idx_gate_questions_topic_id ON gate_questions(topic_id);
CREATE INDEX idx_gate_questions_year ON gate_questions(year);
CREATE INDEX idx_gate_questions_type ON gate_questions(question_type);
CREATE INDEX idx_gate_questions_difficulty ON gate_questions(difficulty);

CREATE INDEX idx_attempts_user_id ON user_question_attempts(user_id);
CREATE INDEX idx_attempts_question_id ON user_question_attempts(question_id);
CREATE INDEX idx_attempts_user_correct ON user_question_attempts(user_id, is_correct);

CREATE INDEX idx_bookmarks_user ON user_bookmarks(user_id);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
ALTER TABLE os_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

-- Public Read Access for Topics & Questions
CREATE POLICY "Allow public read access to OS topics" 
    ON os_topics FOR SELECT USING (true);

CREATE POLICY "Allow public read access to GATE questions" 
    ON gate_questions FOR SELECT USING (true);

-- User-specific policies for Attempts & Bookmarks
CREATE POLICY "Users can manage their own question attempts"
    ON user_question_attempts FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bookmarks"
    ON user_bookmarks FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 9. SEED TOPICS METADATA
INSERT INTO os_topics (id, topic_slug, topic_name, question_count, description) VALUES
(1, 'process-scheduling', 'Process Scheduling & CPU Management', 21, 'FCFS, SJF, SRTF, Round Robin, Priority Scheduling, Gantt Charts, and CPU utilization.'),
(2, 'process-synchronization', 'Process Synchronization & Semaphores', 28, 'Critical Section Problem, Peterson Solution, Semaphores, Producer-Consumer, and Race Conditions.'),
(3, 'deadlocks', 'Deadlocks & Resource Allocation', 18, 'Deadlock conditions, Resource Allocation Graphs, Banker Algorithm, and Safe Sequences.'),
(4, 'memory-management', 'Memory Management & Partitioning', 11, 'Contiguous Allocation, Paging, Segmentation, and Fragmentation.'),
(5, 'virtual-memory', 'Virtual Memory & Page Replacement', 23, 'Demand Paging, FIFO, LRU, Optimal Page Replacement, Belady Anomaly, and EMAT.'),
(6, 'file-systems', 'File Systems & Directory Indexing', 13, 'File Allocation Methods, Unix Inode, Pointer Capacity, and Max File Size.'),
(7, 'disk-scheduling', 'Disk Scheduling & Hardware IO', 12, 'FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK Disk Seek Algorithms.'),
(8, 'threads', 'Threads & Concurrency Models', 5, 'User-level vs Kernel-level Threads, Context Switch Time, and Shared Resources.');
