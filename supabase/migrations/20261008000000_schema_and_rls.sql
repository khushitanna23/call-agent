-- ==============================================================================
-- SUPABASE / POSTGRESQL MULTI-TENANCY SCHEMA FOR WHITE-LABEL VOICE AI SAAS
-- Inspired by Omnidim.io Agency & Sub-Account Architecture
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES & ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'agency_admin', 'client_user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_stage AS ENUM ('new', 'contacted', 'qualified', 'appointment', 'proposal', 'won', 'lost');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE call_sentiment AS ENUM ('positive', 'neutral', 'negative', 'frustrated');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE doc_category AS ENUM ('faq', 'services', 'pricing', 'policy', 'general');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. ORGANIZATIONS (Sub-Accounts / Client Workspaces)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  logo_url TEXT,
  brand_colors JSONB DEFAULT '{"primary": "#10b981", "accent": "#059669", "canvas": "#050505", "card": "#0c0c0e"}'::jsonb,
  twilio_subaccount_sid VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
  plan_type VARCHAR(50) DEFAULT 'growth' CHECK (plan_type IN ('starter', 'growth', 'business', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. USERS (Multi-Tenant Profile Linked to Auth.Users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role user_role DEFAULT 'client_user' NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AGENTS (AI Receptionists per Organization)
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'Sarah',
  voice_id VARCHAR(100) DEFAULT '21m00Tcm4TlvDq8ikWAM',
  prompt TEXT NOT NULL,
  model VARCHAR(100) DEFAULT 'gpt-4o-mini',
  phone_number VARCHAR(50),
  greeting_message TEXT DEFAULT 'Hello! Thanks for calling. How can I help you today?',
  language VARCHAR(20) DEFAULT 'en-US',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. KNOWLEDGE_DOCS (RAG Knowledge Chunks & Text)
CREATE TABLE IF NOT EXISTS knowledge_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  category doc_category DEFAULT 'faq',
  content TEXT NOT NULL,
  doc_type VARCHAR(50) DEFAULT 'custom_text' CHECK (doc_type IN ('custom_text', 'file_pdf', 'url_crawl', 'faq_item')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CALL_LOGS (Voice Inbound/Outbound Telemetry)
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  caller_number VARCHAR(50) NOT NULL,
  caller_name VARCHAR(255),
  duration INT DEFAULT 0, -- in seconds
  recording_url TEXT,
  transcript JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  sentiment call_sentiment DEFAULT 'neutral',
  cost NUMERIC(10, 4) DEFAULT 0.0000,
  call_status VARCHAR(50) DEFAULT 'completed' CHECK (call_status IN ('completed', 'failed', 'busy', 'no-answer', 'in-progress')),
  twilio_call_sid VARCHAR(255),
  vapi_call_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LEADS (CRM Inbound Opportunities Extracted by AI)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  call_id UUID REFERENCES call_logs(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  company VARCHAR(255),
  intent VARCHAR(255) DEFAULT 'General Inquiry',
  score INT DEFAULT 75 CHECK (score BETWEEN 0 AND 100),
  stage lead_stage DEFAULT 'new' NOT NULL,
  budget VARCHAR(100),
  source VARCHAR(100) DEFAULT 'Inbound Voice Call',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. USAGE_BILLING (OmniRelay Agency Markup & Credits)
CREATE TABLE IF NOT EXISTS usage_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  total_minutes INT DEFAULT 0,
  minutes_allowance INT DEFAULT 1000,
  remaining_credits NUMERIC(10, 2) DEFAULT 50.00,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  plan_type VARCHAR(50) DEFAULT 'growth',
  per_minute_base_cost NUMERIC(6, 4) DEFAULT 0.0900, -- Agency buy rate
  per_minute_resell_rate NUMERIC(6, 4) DEFAULT 0.1800, -- Client retail rate (100% markup)
  billing_cycle_start TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. INDEXES FOR HIGH-THROUGHPUT MULTI-TENANCY
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_agents_org ON agents(org_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_org ON knowledge_docs(org_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_org_created ON call_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_org_stage ON leads(org_id, stage);
CREATE INDEX IF NOT EXISTS idx_usage_org ON usage_billing(org_id);

-- 11. HELPER FUNCTIONS FOR ROW-LEVEL SECURITY
CREATE OR REPLACE FUNCTION get_auth_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_agency_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('super_admin', 'agency_admin') FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 12. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all multi-tenant tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_billing ENABLE ROW LEVEL SECURITY;

-- ORGANIZATIONS POLICIES
CREATE POLICY "Admins have full access to all organizations"
  ON organizations FOR ALL
  USING (is_agency_admin());

CREATE POLICY "Clients can view only their own organization"
  ON organizations FOR SELECT
  USING (id = get_auth_org_id());

CREATE POLICY "Clients can update their own organization settings"
  ON organizations FOR UPDATE
  USING (id = get_auth_org_id());

-- USERS POLICIES
CREATE POLICY "Admins have full access to all users"
  ON users FOR ALL
  USING (is_agency_admin());

CREATE POLICY "Users can view members of their organization"
  ON users FOR SELECT
  USING (org_id = get_auth_org_id());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- AGENTS POLICIES
CREATE POLICY "Admins have full access to all agents"
  ON agents FOR ALL
  USING (is_agency_admin());

CREATE POLICY "Clients manage their own organization agents"
  ON agents FOR ALL
  USING (org_id = get_auth_org_id());

-- KNOWLEDGE_DOCS POLICIES
CREATE POLICY "Admins have full access to all knowledge docs"
  ON knowledge_docs FOR ALL
  USING (is_agency_admin());

CREATE POLICY "Clients manage their own knowledge docs"
  ON knowledge_docs FOR ALL
  USING (org_id = get_auth_org_id());

-- CALL_LOGS POLICIES
CREATE POLICY "Admins have full access to all call logs"
  ON call_logs FOR ALL
  USING (is_agency_admin());

CREATE POLICY "Clients can view their own organization call logs"
  ON call_logs FOR SELECT
  USING (org_id = get_auth_org_id());

CREATE POLICY "System/Agents can insert call logs for org"
  ON call_logs FOR INSERT
  WITH CHECK (org_id = get_auth_org_id() OR is_agency_admin());

-- LEADS POLICIES
CREATE POLICY "Admins have full access to all leads"
  ON leads FOR ALL
  USING (is_agency_admin());

CREATE POLICY "Clients manage their own organization leads"
  ON leads FOR ALL
  USING (org_id = get_auth_org_id());

-- USAGE_BILLING POLICIES
CREATE POLICY "Admins have full access to all usage and billing"
  ON usage_billing FOR ALL
  USING (is_agency_admin());

CREATE POLICY "Clients can view only their own usage and billing"
  ON usage_billing FOR SELECT
  USING (org_id = get_auth_org_id());

-- 13. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orgs_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_knowledge_updated_at BEFORE UPDATE ON knowledge_docs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_billing_updated_at BEFORE UPDATE ON usage_billing FOR EACH ROW EXECUTE FUNCTION set_updated_at();
