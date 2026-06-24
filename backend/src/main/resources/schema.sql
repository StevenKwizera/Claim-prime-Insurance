CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    region VARCHAR(255) NOT NULL
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id_or_policy VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'Active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    is_staff_role BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claim_types (
    id VARCHAR(100) PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    description TEXT,
    required_documents TEXT NOT NULL DEFAULT '[]',
    dynamic_fields TEXT NOT NULL DEFAULT '[]',
    sla_hours INTEGER NOT NULL DEFAULT 120,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(100) PRIMARY KEY,
    code VARCHAR(160) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    module VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(100) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS login_audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    event_type VARCHAR(80) NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address VARCHAR(80),
    user_agent TEXT,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    actor_user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    actor_email VARCHAR(255),
    action VARCHAR(160) NOT NULL,
    module VARCHAR(120) NOT NULL,
    entity_type VARCHAR(120) NOT NULL,
    entity_id VARCHAR(120),
    metadata TEXT NOT NULL DEFAULT '{}',
    ip_address VARCHAR(80),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS password_resets (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_verifications (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    otp_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(80) NOT NULL,
    channel VARCHAR(40) NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claims (
    id VARCHAR(100) PRIMARY KEY,
    claimant_name VARCHAR(255) NOT NULL,
    policy_number VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(100) NOT NULL,
    region VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL,
    estimated_completion TIMESTAMPTZ NOT NULL,
    risk_score INTEGER NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    ai_summary TEXT NOT NULL,
    assigned_team VARCHAR(255) NOT NULL,
    assigned_officer VARCHAR(255) NOT NULL,
    documents TEXT NOT NULL,
    timeline TEXT NOT NULL
);

ALTER TABLE claims ADD COLUMN IF NOT EXISTS claimant_user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS claim_type_id VARCHAR(100) REFERENCES claim_types(id) ON DELETE SET NULL;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS priority VARCHAR(60) NOT NULL DEFAULT 'Normal';
ALTER TABLE claims ADD COLUMN IF NOT EXISTS decision_reason TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS escalation_reason TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS verification_status VARCHAR(80) NOT NULL DEFAULT 'Pending';
ALTER TABLE claims ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE claims ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_risk_score ON claims(risk_score);
CREATE INDEX IF NOT EXISTS idx_claims_claimant_user_id ON claims(claimant_user_id);

CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(100) PRIMARY KEY,
    claim_id VARCHAR(100) NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    uploaded_by VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    document_type VARCHAR(120) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    storage_key TEXT NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    size_bytes BIGINT NOT NULL,
    ai_status VARCHAR(80) NOT NULL DEFAULT 'Pending',
    ocr_text TEXT,
    confidence_score NUMERIC(5,2),
    review_note TEXT,
    manually_overridden BOOLEAN NOT NULL DEFAULT FALSE,
    override_reason TEXT,
    verified_by VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_claim_id ON documents(claim_id);
CREATE INDEX IF NOT EXISTS idx_documents_ai_status ON documents(ai_status);

CREATE TABLE IF NOT EXISTS evidence (
    id VARCHAR(100) PRIMARY KEY,
    claim_id VARCHAR(100) NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    uploaded_by VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    folder VARCHAR(160) NOT NULL DEFAULT 'General',
    evidence_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    storage_key TEXT NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    size_bytes BIGINT NOT NULL,
    annotation_data TEXT NOT NULL DEFAULT '{}',
    chain_of_custody TEXT NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_claim_id ON evidence(claim_id);

CREATE TABLE IF NOT EXISTS fraud_flags (
    id VARCHAR(100) PRIMARY KEY,
    claim_id VARCHAR(100) NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    rule_code VARCHAR(120) NOT NULL,
    severity VARCHAR(60) NOT NULL,
    score_delta INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    status VARCHAR(80) NOT NULL DEFAULT 'Open',
    created_by VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    resolved_by VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_flags_claim_id ON fraud_flags(claim_id);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_status ON fraud_flags(status);

CREATE TABLE IF NOT EXISTS investigations (
    id VARCHAR(100) PRIMARY KEY,
    claim_id VARCHAR(100) NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    assigned_investigator_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(80) NOT NULL DEFAULT 'Open',
    summary TEXT NOT NULL,
    findings TEXT,
    linked_cases TEXT NOT NULL DEFAULT '[]',
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_investigations_claim_id ON investigations(claim_id);

CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(220) NOT NULL,
    report_type VARCHAR(120) NOT NULL,
    format VARCHAR(40) NOT NULL,
    filters TEXT NOT NULL DEFAULT '{}',
    schedule VARCHAR(120),
    status VARCHAR(80) NOT NULL DEFAULT 'Draft',
    generated_by VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    storage_key TEXT,
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(100) NOT NULL,
    at TIMESTAMPTZ NOT NULL
);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channel VARCHAR(40) NOT NULL DEFAULT 'In-App';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(80) NOT NULL DEFAULT 'Queued';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS template_code VARCHAR(120);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_claim_id VARCHAR(100) REFERENCES claims(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

CREATE TABLE IF NOT EXISTS direct_messages (
    id VARCHAR(100) PRIMARY KEY,
    from_user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    related_claim_id VARCHAR(100) REFERENCES claims(id) ON DELETE SET NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_from_user ON direct_messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_to_user ON direct_messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at DESC);

INSERT INTO claim_types (id, code, name, description, required_documents, dynamic_fields, sla_hours)
VALUES
    ('ct-auto', 'auto', 'Motor / Auto Claim', 'Vehicle accident and repair claim workflow.', '["Police abstract","Vehicle photos","Repair estimate","Driver license"]', '["incidentLocation","vehicleRegistration","garageName","thirdPartyInvolved"]', 120),
    ('ct-health', 'health', 'Health Claim', 'Medical reimbursement and provider claim workflow.', '["Medical note","Discharge summary","Invoice","Prescription"]', '["hospitalName","patientName","treatmentDate","providerCode"]', 96),
    ('ct-property', 'property', 'Property Claim', 'Home, fire, flood, and asset damage claim workflow.', '["Ownership proof","Damage photos","Incident report","Repair quote"]', '["propertyAddress","incidentCause","assetCategory","occupancyStatus"]', 168)
ON CONFLICT (id) DO NOTHING;

INSERT INTO roles (id, name, description, is_staff_role)
VALUES
    ('role-claimant', 'claimant', 'Customer self-service claimant role.', FALSE),
    ('role-agent', 'agent', 'Agent supporting customer claim intake.', TRUE),
    ('role-officer', 'officer', 'Claims officer handling verification and decisions.', TRUE),
    ('role-supervisor', 'supervisor', 'Supervisor handling escalations, approvals, and workload.', TRUE),
    ('role-investigator', 'fraud-investigator', 'Fraud investigator reviewing flagged claims.', TRUE),
    ('role-admin', 'admin', 'System administrator managing users, workflows, security, and platform settings.', TRUE)
ON CONFLICT (id) DO NOTHING;

UPDATE users SET role = 'admin' WHERE role IN ('super-admin', 'superadmin');
DELETE FROM users WHERE role IN ('compliance-officer', 'compliance', 'super-admin', 'superadmin');
DELETE FROM roles WHERE name IN ('compliance-officer', 'compliance', 'super-admin', 'superadmin');
