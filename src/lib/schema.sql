-- lib/schema.sql





-- Core Government Structure Tables (Chronological order)
CREATE TABLE IF NOT EXISTS clusters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    chair_ministry_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ministries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    acronym VARCHAR(50),
    cluster_id INTEGER REFERENCES clusters(id) ON DELETE SET NULL,
    cabinet_secretary INTEGER REFERENCES users(id) ON DELETE SET NULL,
    headquarters VARCHAR(255),
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS state_departments (
    id SERIAL PRIMARY KEY,
    ministry_id INTEGER REFERENCES ministries(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    ps VARCHAR(255),
    location VARCHAR(255),
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ministry_id, name)
);

CREATE TABLE IF NOT EXISTS agencies (
    id SERIAL PRIMARY KEY,
    state_department_id INTEGER REFERENCES state_departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    director_general VARCHAR(255),
    acronym VARCHAR(255),
    location VARCHAR(255),
    website VARCHAR(255),
    email VARCHAR(255), 
    phone VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(state_department_id, name)
);

-- User Management
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL CHECK (role IN (
        'President',
        'Deputy President',
        'Prime Cabinet Secretary',
        'Cabinet Secretary',
        'Principal Secretary',
        'Cabinet Secretariat',
        'Director',
        'Assistant Director',
        'Admin',
        'Attorney General',
        'Secretary to the Cabinet'
    )),
    status VARCHAR(20) DEFAULT 'pending', -- default for new secretariat users
    phone VARCHAR(20),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create function to auto-activate Admin accounts
CREATE OR REPLACE FUNCTION set_admin_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'Admin' THEN
        NEW.status := 'active';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run before insert or update
CREATE TRIGGER trigger_set_admin_status
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_admin_status();


-- Document Management System
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    document_type VARCHAR(50) NOT NULL, -- memo, agenda, minutes, annex, etc.
    status VARCHAR(20) DEFAULT 'draft',
    access_level VARCHAR(20) DEFAULT 'restricted', -- restricted, committee, cabinet, public
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Government Memo Workflow
CREATE TABLE IF NOT EXISTS gov_memos (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL, -- Changed from title to name
    summary TEXT, -- Will be auto-generated from body
    body TEXT, -- Rich text content
    memo_type VARCHAR(50) DEFAULT 'cabinet',
    ministry_id INTEGER REFERENCES ministries(id) ON DELETE CASCADE, -- Changed from submitting_ministry_id
    state_department_id INTEGER REFERENCES state_departments(id) ON DELETE SET NULL,
    agency_id INTEGER REFERENCES agencies(id) ON DELETE SET NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'draft',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gov_memos_ministry_id ON gov_memos(ministry_id);
CREATE INDEX IF NOT EXISTS idx_gov_memos_state_department_id ON gov_memos(state_department_id);
CREATE INDEX IF NOT EXISTS idx_gov_memos_agency_id ON gov_memos(agency_id);
CREATE INDEX IF NOT EXISTS idx_gov_memos_created_by ON gov_memos(created_by);
CREATE INDEX IF NOT EXISTS idx_gov_memos_status ON gov_memos(status);

-- Pivot table for affected entities
CREATE TABLE IF NOT EXISTS memo_affected_entities (
    id SERIAL PRIMARY KEY,
    memo_id INTEGER REFERENCES gov_memos(id) ON DELETE CASCADE,
    ministry_id INTEGER REFERENCES ministries(id) ON DELETE CASCADE,
    state_department_id INTEGER REFERENCES state_departments(id) ON DELETE CASCADE,
    agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
    entity_type VARCHAR(20) NOT NULL, -- ministry, state_department, agency
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Memo Workflows 
CREATE TABLE IF NOT EXISTS memo_workflows (
  id SERIAL PRIMARY KEY,
  memo_id INTEGER REFERENCES gov_memos(id) ON DELETE CASCADE,
  current_stage VARCHAR(50) NOT NULL,
  next_stage VARCHAR(50),
  target_committee VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pivot table for memo documents
CREATE TABLE IF NOT EXISTS memo_documents (
    id SERIAL PRIMARY KEY,
    memo_id INTEGER REFERENCES gov_memos(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(memo_id, document_id)
);

-- Committee Structure
CREATE TABLE IF NOT EXISTS cabinet_committees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    cluster_id INTEGER REFERENCES clusters(id) ON DELETE SET NULL,
    chair_title VARCHAR(100) DEFAULT 'Deputy President',
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meeting Management
CREATE TABLE IF NOT EXISTS meetings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    committee_id INTEGER REFERENCES cabinet_committees(id) ON DELETE CASCADE,
    meeting_type VARCHAR(50) DEFAULT 'cabinet_committee', -- cabinet_committee, full_cabinet
    scheduled_at TIMESTAMP,
    location VARCHAR(255),
    chair_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agenda Management with Pivot Table
CREATE TABLE IF NOT EXISTS agenda (
    id SERIAL PRIMARY KEY,
    meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
    memo_id INTEGER REFERENCES gov_memos(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    presenter_ministry_id INTEGER REFERENCES ministries(id) ON DELETE CASCADE,
    presenter_name VARCHAR(255),
    duration INTEGER DEFAULT 15,
    sort_order INTEGER,
    discussion_points JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- pending, discussed, approved, deferred
    cabinet_approval_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pivot table for agenda documents
CREATE TABLE IF NOT EXISTS agenda_documents (
    id SERIAL PRIMARY KEY,
    agenda_id INTEGER REFERENCES agenda(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agenda_id, document_id)
);

-- User Notes and Annotations (Private to users)
CREATE TABLE IF NOT EXISTS user_notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    agenda_id INTEGER REFERENCES agenda(id) ON DELETE CASCADE,
    note_type VARCHAR(20) DEFAULT 'text', -- text, annotation
    content TEXT,
    annotation_image_path VARCHAR(500), -- For handwritten annotations as images
    page_number INTEGER,
    coordinates JSONB, -- For annotation positioning {x, y, width, height}
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deliberations and Decisions
CREATE TABLE IF NOT EXISTS deliberations (
    id SERIAL PRIMARY KEY,
    agenda_id INTEGER REFERENCES agenda(id) ON DELETE CASCADE,
    discussion_summary TEXT,
    recommendations TEXT,
    decision_type VARCHAR(50), -- approved, referred, deferred, rejected
    decision_text TEXT,
    requires_president_signature BOOLEAN DEFAULT FALSE,
    signed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    signed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Minutes Management
CREATE TABLE IF NOT EXISTS meeting_minutes (
    id SERIAL PRIMARY KEY,
    meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    prepared_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Action Letters to Ministries
CREATE TABLE IF NOT EXISTS action_letters (
    id SERIAL PRIMARY KEY,
    deliberation_id INTEGER REFERENCES deliberations(id) ON DELETE CASCADE,
    to_ministry_id INTEGER REFERENCES ministries(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    subject VARCHAR(500),
    content TEXT,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, acknowledged, completed
    sent_at TIMESTAMP,
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cabinet Releases (Official confidential documents)
CREATE TABLE IF NOT EXISTS cabinet_releases (
    id SERIAL PRIMARY KEY,
    meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    title VARCHAR(500),
    content TEXT,
    release_type VARCHAR(50) DEFAULT 'confidential', -- confidential, public
    published_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- President Signing Records
CREATE TABLE IF NOT EXISTS presidential_signatures (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    signed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    signed_at TIMESTAMP,
    signature_type VARCHAR(50), -- minutes, action_letter, cabinet_release
    reference_id INTEGER, -- ID of the related record (minutes_id, etc.)
    reference_type VARCHAR(50), -- minutes, action_letter, cabinet_release
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs for Security
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100),
    target_id INTEGER,
    metadata JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_gov_memos_submitting_ministry ON gov_memos(submitting_ministry_id);
CREATE INDEX IF NOT EXISTS idx_gov_memos_status ON gov_memos(status);
CREATE INDEX IF NOT EXISTS idx_agenda_meeting_id ON agenda(meeting_id);
CREATE INDEX IF NOT EXISTS idx_agenda_memo_id ON agenda(memo_id);
CREATE INDEX IF NOT EXISTS idx_agenda_status ON agenda(status);
CREATE INDEX IF NOT EXISTS idx_deliberations_agenda_id ON deliberations(agenda_id);
CREATE INDEX IF NOT EXISTS idx_action_letters_deliberation_id ON action_letters(deliberation_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_user_agenda ON user_notes(user_id, agenda_id);
CREATE INDEX IF NOT EXISTS idx_documents_access_level ON documents(access_level);
CREATE INDEX IF NOT EXISTS idx_meetings_committee_id ON meetings(committee_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON meetings(scheduled_at);