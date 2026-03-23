-- ═══════════════════════════════════════════════════════════════════════════
-- InboundAI Platform — Multi-Tenant Database Schema
-- Similar to Vapi AI architecture
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ═══════════════════════════════════════════════════════════════════════════
-- LEVEL 1: ORGANIZATIONS (Top-level tenant)
-- Each org = one customer account (like a Vapi "organization")
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE organizations (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            text NOT NULL,
    slug            text UNIQUE NOT NULL,               -- URL-safe identifier
    plan            text NOT NULL DEFAULT 'free'        -- free | starter | pro | enterprise
                    CHECK (plan IN ('free','starter','pro','enterprise')),
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════
-- LEVEL 2: USERS + ORG MEMBERSHIP
-- Users belong to organizations with roles
-- ═══════════════════════════════════════════════════════════════════════════

-- Extends Supabase auth.users
CREATE TABLE user_profiles (
    id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name       text,
    avatar_url      text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE org_members (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role            text NOT NULL DEFAULT 'member'
                    CHECK (role IN ('owner','admin','member','viewer')),
    invited_by      uuid REFERENCES auth.users(id),
    joined_at       timestamptz NOT NULL DEFAULT now(),
    UNIQUE (org_id, user_id)
);


-- ═══════════════════════════════════════════════════════════════════════════
-- LEVEL 3: AGENTS (AI Voice Assistants)
-- Each org can have multiple agents with their own config
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE agents (
    id                          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id                      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name                        text NOT NULL,
    description                 text,
    is_active                   boolean NOT NULL DEFAULT true,

    -- ── Conversation ─────────────────────────────────────────────────────
    first_message               text,
    system_prompt               text,
    language                    text NOT NULL DEFAULT 'hi-IN',
    max_duration_seconds        integer NOT NULL DEFAULT 600,
    allow_interruptions         boolean NOT NULL DEFAULT true,
    end_call_phrases            text[] DEFAULT ARRAY['bye','goodbye','cut the call'],

    -- ── LLM ──────────────────────────────────────────────────────────────
    llm_provider                text NOT NULL DEFAULT 'openai'
                                CHECK (llm_provider IN ('openai','gemini','anthropic')),
    llm_model                   text NOT NULL DEFAULT 'gpt-4o-mini',
    llm_temperature             numeric(3,2) NOT NULL DEFAULT 0.7,

    -- ── STT ──────────────────────────────────────────────────────────────
    stt_provider                text NOT NULL DEFAULT 'sarvam'
                                CHECK (stt_provider IN ('sarvam','deepgram','openai')),
    stt_model                   text NOT NULL DEFAULT 'saaras:v3',
    stt_language                text NOT NULL DEFAULT 'hi-IN',
    stt_mode                    text NOT NULL DEFAULT 'translate'
                                CHECK (stt_mode IN ('translate','transcribe')),
    stt_endpointing_delay       numeric(4,2) NOT NULL DEFAULT 0.6,

    -- ── TTS ──────────────────────────────────────────────────────────────
    tts_provider                text NOT NULL DEFAULT 'sarvam'
                                CHECK (tts_provider IN ('sarvam','elevenlabs','openai','google')),
    tts_model                   text NOT NULL DEFAULT 'bulbul:v3',
    tts_voice                   text NOT NULL DEFAULT 'kavya',
    tts_language                text NOT NULL DEFAULT 'hi-IN',
    tts_speed                   numeric(3,2) NOT NULL DEFAULT 1.0,

    -- ── VAD ──────────────────────────────────────────────────────────────
    vad_activation_threshold    numeric(3,2) NOT NULL DEFAULT 0.55,
    vad_min_silence_duration    numeric(4,2) NOT NULL DEFAULT 0.6,
    vad_min_speech_duration     numeric(4,2) NOT NULL DEFAULT 0.2,
    min_interruption_duration   numeric(4,2) NOT NULL DEFAULT 0.8,

    created_at                  timestamptz NOT NULL DEFAULT now(),
    updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- Tools/integrations enabled per agent
CREATE TABLE agent_tools (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id        uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    tool_type       text NOT NULL
                    CHECK (tool_type IN ('calendar','transfer','end_call','webhook','crm_lookup')),
    config          jsonb NOT NULL DEFAULT '{}',      -- tool-specific settings
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════
-- LEVEL 4: PHONE NUMBERS
-- SIP/Vobiz numbers linked to org and optionally to an agent
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE phone_numbers (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id        uuid REFERENCES agents(id) ON DELETE SET NULL,
    number          text NOT NULL,                    -- E.164: +919876543210
    label           text,                             -- friendly name
    provider        text NOT NULL DEFAULT 'vobiz'
                    CHECK (provider IN ('vobiz','twilio','vonage','custom_sip')),
    sip_trunk_id    text,
    capabilities    text NOT NULL DEFAULT 'both'
                    CHECK (capabilities IN ('inbound','outbound','both')),
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (org_id, number)
);


-- ═══════════════════════════════════════════════════════════════════════════
-- LEVEL 5: CALLS
-- Every call (inbound + outbound) across all agents
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE calls (
    id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id              uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id            uuid REFERENCES agents(id) ON DELETE SET NULL,
    phone_number_id     uuid REFERENCES phone_numbers(id) ON DELETE SET NULL,

    direction           text NOT NULL DEFAULT 'inbound'
                        CHECK (direction IN ('inbound','outbound')),
    from_number         text,
    to_number           text,
    caller_name         text,
    caller_email        text,

    status              text NOT NULL DEFAULT 'initiated'
                        CHECK (status IN ('initiated','ringing','in_progress','completed','failed','no_answer','busy')),
    ended_reason        text,                         -- user_hangup | agent_hangup | max_duration | error | transfer

    started_at          timestamptz,
    answered_at         timestamptz,
    ended_at            timestamptz,
    duration_seconds    integer,

    transcript          text,
    summary             text,
    recording_url       text,
    cost_credits        numeric(10,4) DEFAULT 0,      -- for billing

    livekit_room_name   text,
    metadata            jsonb DEFAULT '{}',           -- extra fields

    created_at          timestamptz NOT NULL DEFAULT now()
);

-- Per-turn transcript (individual speaker turns)
CREATE TABLE call_messages (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id     uuid NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    role        text NOT NULL CHECK (role IN ('user','assistant','tool')),
    content     text NOT NULL,
    timestamp   numeric,                              -- seconds from call start
    created_at  timestamptz NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════
-- LEVEL 6: CONTACTS (CRM)
-- Lead / contact database per org
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE contacts (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    phone       text NOT NULL,                        -- E.164
    name        text,
    email       text,
    tags        text[] DEFAULT '{}',
    notes       text,
    metadata    jsonb DEFAULT '{}',                   -- custom fields
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (org_id, phone)
);


-- ═══════════════════════════════════════════════════════════════════════════
-- LEVEL 7: CAMPAIGNS (Outbound calling)
-- Bulk outbound call campaigns linked to an agent
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE campaigns (
    id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id                  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id                uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    phone_number_id         uuid REFERENCES phone_numbers(id) ON DELETE SET NULL,
    name                    text NOT NULL,
    status                  text NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','scheduled','running','paused','completed','cancelled')),
    first_message_template  text,
    max_attempts            integer NOT NULL DEFAULT 1,
    retry_delay_minutes     integer NOT NULL DEFAULT 60,
    schedule_start_at       timestamptz,
    schedule_end_at         timestamptz,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE campaign_contacts (
    id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id         uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id          uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    call_id             uuid REFERENCES calls(id) ON DELETE SET NULL,
    status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','calling','completed','failed','no_answer','do_not_call')),
    attempts            integer NOT NULL DEFAULT 0,
    last_attempt_at     timestamptz,
    UNIQUE (campaign_id, contact_id)
);


-- ═══════════════════════════════════════════════════════════════════════════
-- LEVEL 8: INTEGRATIONS
-- WhatsApp, Telegram, Cal.com etc. configured per org
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE integrations (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type            text NOT NULL
                    CHECK (type IN ('whatsapp','telegram','cal_com','webhook','zapier','slack')),
    label           text,
    config          jsonb NOT NULL DEFAULT '{}',      -- credentials, phone_number_id, token, etc.
    is_active       boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (org_id, type)
);


-- ═══════════════════════════════════════════════════════════════════════════
-- LEVEL 9: API KEYS
-- Programmatic access per org (like Vapi API keys)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE api_keys (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by      uuid REFERENCES auth.users(id),
    name            text NOT NULL,
    key_hash        text NOT NULL UNIQUE,             -- sha256 hash of actual key
    key_prefix      text NOT NULL,                   -- first 8 chars e.g. "sk_live_"
    scopes          text[] DEFAULT ARRAY['read','write'],
    last_used_at    timestamptz,
    expires_at      timestamptz,
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════
-- LEVEL 10: USAGE & BILLING
-- Track minutes/calls consumed per billing period
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE usage_records (
    id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id                  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    period_start            timestamptz NOT NULL,
    period_end              timestamptz NOT NULL,
    calls_count             integer NOT NULL DEFAULT 0,
    call_minutes_used       numeric(10,2) NOT NULL DEFAULT 0,
    plan_limit_minutes      integer,
    overage_minutes         numeric(10,2) NOT NULL DEFAULT 0,
    created_at              timestamptz NOT NULL DEFAULT now(),
    UNIQUE (org_id, period_start)
);


-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES (performance)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_org_members_org      ON org_members(org_id);
CREATE INDEX idx_org_members_user     ON org_members(user_id);
CREATE INDEX idx_agents_org           ON agents(org_id);
CREATE INDEX idx_phone_numbers_org    ON phone_numbers(org_id);
CREATE INDEX idx_phone_numbers_agent  ON phone_numbers(agent_id);
CREATE INDEX idx_calls_org            ON calls(org_id);
CREATE INDEX idx_calls_agent          ON calls(agent_id);
CREATE INDEX idx_calls_created        ON calls(created_at DESC);
CREATE INDEX idx_calls_status         ON calls(status);
CREATE INDEX idx_call_messages_call   ON call_messages(call_id);
CREATE INDEX idx_contacts_org         ON contacts(org_id);
CREATE INDEX idx_contacts_phone       ON contacts(org_id, phone);
CREATE INDEX idx_campaigns_org        ON campaigns(org_id);
CREATE INDEX idx_campaign_contacts    ON campaign_contacts(campaign_id);
CREATE INDEX idx_integrations_org     ON integrations(org_id);
CREATE INDEX idx_api_keys_org         ON api_keys(org_id);
CREATE INDEX idx_usage_org_period     ON usage_records(org_id, period_start);


-- ═══════════════════════════════════════════════════════════════════════════
-- AUTO-UPDATE updated_at TRIGGER
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated   BEFORE UPDATE ON organizations   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_agents_updated          BEFORE UPDATE ON agents          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_phone_numbers_updated   BEFORE UPDATE ON phone_numbers   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_contacts_updated        BEFORE UPDATE ON contacts        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_campaigns_updated       BEFORE UPDATE ON campaigns       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_integrations_updated    BEFORE UPDATE ON integrations    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- Users can only see data belonging to their org
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tools        ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_numbers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls              ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns          ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contacts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys           ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records      ENABLE ROW LEVEL SECURITY;

-- Helper: returns all org_ids the current user belongs to
CREATE OR REPLACE FUNCTION my_org_ids()
RETURNS SETOF uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT org_id FROM org_members WHERE user_id = auth.uid();
$$;

-- Policies: each table is visible only to members of the same org
CREATE POLICY "org_isolation" ON organizations      FOR ALL USING (id IN (SELECT my_org_ids()));
CREATE POLICY "org_isolation" ON org_members        FOR ALL USING (org_id IN (SELECT my_org_ids()));
CREATE POLICY "org_isolation" ON agents             FOR ALL USING (org_id IN (SELECT my_org_ids()));
CREATE POLICY "org_isolation" ON agent_tools        FOR ALL USING (agent_id IN (SELECT id FROM agents WHERE org_id IN (SELECT my_org_ids())));
CREATE POLICY "org_isolation" ON phone_numbers      FOR ALL USING (org_id IN (SELECT my_org_ids()));
CREATE POLICY "org_isolation" ON calls              FOR ALL USING (org_id IN (SELECT my_org_ids()));
CREATE POLICY "org_isolation" ON call_messages      FOR ALL USING (call_id IN (SELECT id FROM calls WHERE org_id IN (SELECT my_org_ids())));
CREATE POLICY "org_isolation" ON contacts           FOR ALL USING (org_id IN (SELECT my_org_ids()));
CREATE POLICY "org_isolation" ON campaigns          FOR ALL USING (org_id IN (SELECT my_org_ids()));
CREATE POLICY "org_isolation" ON campaign_contacts  FOR ALL USING (campaign_id IN (SELECT id FROM campaigns WHERE org_id IN (SELECT my_org_ids())));
CREATE POLICY "org_isolation" ON integrations       FOR ALL USING (org_id IN (SELECT my_org_ids()));
CREATE POLICY "org_isolation" ON api_keys           FOR ALL USING (org_id IN (SELECT my_org_ids()));
CREATE POLICY "org_isolation" ON usage_records      FOR ALL USING (org_id IN (SELECT my_org_ids()));
CREATE POLICY "own_profile"   ON user_profiles      FOR ALL USING (id = auth.uid());

-- Service role bypass (for backend Python agent — uses service key)
CREATE POLICY "service_all" ON calls             FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON call_messages     FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON contacts          FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON integrations      FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON usage_records     FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON agents            FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON phone_numbers     FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON campaign_contacts FOR ALL TO service_role USING (true);
