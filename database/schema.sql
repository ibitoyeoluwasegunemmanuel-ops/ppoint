-- Automatic Building Mapping System
CREATE TABLE IF NOT EXISTS buildings (
    id SERIAL PRIMARY KEY,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    building_polygon GEOMETRY(POLYGON, 4326),
    confidence_score DOUBLE PRECISION,
    country VARCHAR(64),
    state VARCHAR(64),
    city VARCHAR(64),
    community VARCHAR(64),
    street VARCHAR(128),
    ppoint_code VARCHAR(64) UNIQUE,
    status VARCHAR(16) DEFAULT 'unverified', -- unverified, verified, claimed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS building_entrances (
    id SERIAL PRIMARY KEY,
    building_id INTEGER REFERENCES buildings(id),
    entrance_type VARCHAR(32), -- main, vehicle, delivery, parking
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    description VARCHAR(128)
);

CREATE TABLE IF NOT EXISTS building_claims (
    id SERIAL PRIMARY KEY,
    building_id INTEGER REFERENCES buildings(id),
    user_id INTEGER,
    building_name VARCHAR(128),
    business_name VARCHAR(128),
    delivery_instructions TEXT,
    landmark VARCHAR(128),
    phone_number VARCHAR(32),
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS continents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(3) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    continent_id INTEGER REFERENCES continents(id),
    country_name VARCHAR(100) NOT NULL,
    country_code VARCHAR(8) NOT NULL,
    name VARCHAR(100),
    code VARCHAR(8),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(country_code)
);

ALTER TABLE countries
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE countries
ADD COLUMN IF NOT EXISTS name VARCHAR(100);

ALTER TABLE countries
ADD COLUMN IF NOT EXISTS code VARCHAR(3);

ALTER TABLE countries
ALTER COLUMN country_code TYPE VARCHAR(8);

ALTER TABLE countries
ALTER COLUMN code TYPE VARCHAR(8);

UPDATE countries
SET name = country_name
WHERE name IS NULL;

UPDATE countries
SET code = country_code
WHERE code IS NULL;

CREATE TABLE IF NOT EXISTS states (
    id SERIAL PRIMARY KEY,
    country_id INTEGER REFERENCES countries(id),
    state_name VARCHAR(100) NOT NULL,
    state_code VARCHAR(24) NOT NULL,
    UNIQUE(country_id, state_code)
);

ALTER TABLE states
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

ALTER TABLE states
ALTER COLUMN state_code TYPE VARCHAR(24);

CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    state_id INTEGER REFERENCES states(id),
    country_id INTEGER REFERENCES countries(id),
    city_name VARCHAR(100) NOT NULL,
    city_code VARCHAR(64) NOT NULL UNIQUE,
    min_latitude DECIMAL(10, 8) NOT NULL,
    max_latitude DECIMAL(10, 8) NOT NULL,
    min_longitude DECIMAL(11, 8) NOT NULL,
    max_longitude DECIMAL(11, 8) NOT NULL,
    boundary GEOMETRY(POLYGON, 4326),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE cities
ALTER COLUMN city_code TYPE VARCHAR(64);

CREATE TABLE IF NOT EXISTS areas (
    id SERIAL PRIMARY KEY,
    city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
    area_name VARCHAR(120) NOT NULL,
    area_code VARCHAR(8) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    ppoint_code VARCHAR(32) UNIQUE,
    city_code VARCHAR(64) REFERENCES cities(city_code),
    area_id INTEGER REFERENCES areas(id),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location GEOMETRY(POINT, 4326),
    country VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    district VARCHAR(120),
    community_name VARCHAR(160),
    building_name VARCHAR(180),
    house_number VARCHAR(40),
    street_name VARCHAR(180),
    building_polygon_id VARCHAR(64),
    landmark VARCHAR(255),
    street_description TEXT,
    description TEXT,
    phone_number VARCHAR(40),
    entrance_label VARCHAR(80),
    entrance_latitude DECIMAL(10, 8),
    entrance_longitude DECIMAL(11, 8),
    confidence_score INTEGER DEFAULT 0,
    auto_generated_flag BOOLEAN DEFAULT false,
    place_type VARCHAR(64),
    custom_place_type VARCHAR(120),
    address_metadata JSONB DEFAULT '{}'::jsonb,
    address_type VARCHAR(40) DEFAULT 'community',
    created_by VARCHAR(120) DEFAULT 'Community',
    created_source VARCHAR(40) DEFAULT 'community',
    moderation_status VARCHAR(40) DEFAULT 'active',
    reviewed_by VARCHAR(120),
    reviewed_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS ppoint_code VARCHAR(32);

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS area_id INTEGER REFERENCES areas(id);

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS city VARCHAR(100);

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS district VARCHAR(120);

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS community_name VARCHAR(160);

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS landmark VARCHAR(255);

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS building_name VARCHAR(180);

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS house_number VARCHAR(40);

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS street_name VARCHAR(180);

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS building_polygon_id VARCHAR(64);

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS street_description TEXT;

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(40);

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS entrance_label VARCHAR(80);

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS entrance_latitude DECIMAL(10, 8);

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS entrance_longitude DECIMAL(11, 8);

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS confidence_score INTEGER DEFAULT 0;

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS auto_generated_flag BOOLEAN DEFAULT false;

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS place_type VARCHAR(64);

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS custom_place_type VARCHAR(120);

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS address_metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS address_type VARCHAR(40) DEFAULT 'community';

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS created_by VARCHAR(120) DEFAULT 'Community';

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS created_source VARCHAR(40) DEFAULT 'community';

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(40) DEFAULT 'pending';

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(120);

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE addresses
ALTER COLUMN city_code TYPE VARCHAR(64);

ALTER TABLE addresses
ALTER COLUMN code TYPE VARCHAR(32);

UPDATE addresses
SET ppoint_code = code
WHERE ppoint_code IS NULL;

ALTER TABLE addresses
ALTER COLUMN ppoint_code SET NOT NULL;

UPDATE addresses
SET moderation_status = 'active'
WHERE moderation_status IS NULL OR moderation_status = 'pending';

UPDATE addresses
SET street_description = description
WHERE street_description IS NULL AND description IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_ppoint_code ON addresses(ppoint_code);

CREATE INDEX IF NOT EXISTS idx_addresses_moderation_status ON addresses(moderation_status);

CREATE INDEX IF NOT EXISTS idx_addresses_address_type ON addresses(address_type);

CREATE TABLE IF NOT EXISTS businesses (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(180) NOT NULL,
    business_category VARCHAR(120) NOT NULL,
    contact_phone VARCHAR(40) NOT NULL,
    email VARCHAR(180) NOT NULL,
    ppoint_code VARCHAR(32) NOT NULL REFERENCES addresses(ppoint_code),
    website VARCHAR(255),
    business_description TEXT NOT NULL,
    opening_hours VARCHAR(160) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS field_agents (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(180) NOT NULL,
    phone_number VARCHAR(40) NOT NULL,
    email VARCHAR(180),
    country VARCHAR(120) NOT NULL,
    state VARCHAR(120) NOT NULL,
    city VARCHAR(120) NOT NULL,
    territory VARCHAR(180) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    slug VARCHAR(40) NOT NULL UNIQUE,
    description TEXT,
    price_ngn DECIMAL(12, 2) DEFAULT 0,
    price_usd DECIMAL(12, 2) DEFAULT 0,
    request_limit INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS developers (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(160) NOT NULL,
    website VARCHAR(255),
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    api_key VARCHAR(80) UNIQUE,
    plan VARCHAR(40) NOT NULL DEFAULT 'free',
    status VARCHAR(40) NOT NULL DEFAULT 'pending_payment',
    billing_country VARCHAR(8) DEFAULT 'NG',
    billing_currency VARCHAR(8) DEFAULT 'NGN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_usage (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER REFERENCES developers(id) ON DELETE CASCADE,
    request_count INTEGER DEFAULT 0,
    month VARCHAR(7) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(developer_id, month)
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER REFERENCES developers(id) ON DELETE CASCADE,
    plan_slug VARCHAR(40) NOT NULL,
    payment_method VARCHAR(40) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL,
    proof_name VARCHAR(255),
    proof_data TEXT,
    proof_reference VARCHAR(255),
    status VARCHAR(40) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_settings (
    id SERIAL PRIMARY KEY,
    platform_name VARCHAR(160) NOT NULL DEFAULT 'PPOINT Africa',
    domain VARCHAR(255) NOT NULL DEFAULT 'ppoint.africa',
    api_base_url VARCHAR(255) DEFAULT 'https://api.ppoint.africa/api',
    api_rate_limit INTEGER NOT NULL DEFAULT 100,
    qr_enabled BOOLEAN DEFAULT true,
    payment_methods JSONB DEFAULT '{}'::jsonb,
    bank_transfer_details JSONB DEFAULT '{}'::jsonb,
    support_contacts JSONB DEFAULT '{}'::jsonb,
    map_api_keys JSONB DEFAULT '{}'::jsonb,
    currency_settings JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS national_addresses (
    id SERIAL PRIMARY KEY,
    ppoint_code VARCHAR(32) NOT NULL UNIQUE,
    country VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(120),
    street_or_landmark TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    building_name VARCHAR(180),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_status VARCHAR(40) DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_national_addresses_ppoint_code ON national_addresses(ppoint_code);
CREATE INDEX IF NOT EXISTS idx_national_addresses_verified_status ON national_addresses(verified_status);

CREATE TABLE IF NOT EXISTS staff_accounts (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    role VARCHAR(40) NOT NULL CHECK (role IN ('Super Admin', 'Regional Manager', 'City Admin', 'Field Officer')),
    region_level VARCHAR(20) NOT NULL CHECK (region_level IN ('continent', 'country', 'state', 'city', 'area')),
    region_id INTEGER,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_addresses_location ON addresses USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_addresses_code ON addresses(code);
CREATE INDEX IF NOT EXISTS idx_cities_boundary ON cities USING GIST(boundary);
CREATE INDEX IF NOT EXISTS idx_areas_city_id ON areas(city_id);
CREATE INDEX IF NOT EXISTS idx_staff_accounts_region ON staff_accounts(region_level, region_id);

CREATE TABLE IF NOT EXISTS public_usage (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(255) UNIQUE NOT NULL, -- IP address or Guest ID
    count INTEGER DEFAULT 0,
    last_generation_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS creator_name VARCHAR(180),
ADD COLUMN IF NOT EXISTS profile_id INTEGER;

CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(180) NOT NULL,
    phone_number VARCHAR(40) UNIQUE NOT NULL,
    email VARCHAR(180) UNIQUE,
    bio TEXT,
    avatar_url TEXT,
    ppoint_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed profile for Ibitoye Oluwasegun Emmanuel
INSERT INTO user_profiles (full_name, phone_number, email)
VALUES ('Ibitoye Oluwasegun Emmanuel', '+2349076530908', 'emmanuel@ppoint.africa')
ON CONFLICT (phone_number) DO NOTHING;

-- Agent Applications Table
CREATE TABLE IF NOT EXISTS agent_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user_profiles(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    experience INTEGER NOT NULL,
    references TEXT,
    documents JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    score INTEGER,
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by VARCHAR(255),
    review_date TIMESTAMP,
    notes TEXT
);

-- Create indexes for agent applications
CREATE INDEX IF NOT EXISTS idx_agent_applications_status ON agent_applications(status);
CREATE INDEX IF NOT EXISTS idx_agent_applications_user_id ON agent_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_applications_country ON agent_applications(country);
CREATE INDEX IF NOT EXISTS idx_agent_applications_applied_date ON agent_applications(applied_date DESC);

-- Emergency Incidents Table
CREATE TABLE IF NOT EXISTS emergency_incidents (
    id SERIAL PRIMARY KEY,
    reporter_name VARCHAR(255) NOT NULL,
    reporter_phone VARCHAR(20) NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    incident_type VARCHAR(100) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'reported' CHECK (status IN ('reported', 'assigned', 'in_progress', 'closed')),
    dispatcher_id INTEGER,
    dispatcher_name VARCHAR(255),
    address VARCHAR(500),
    resolution_notes TEXT,
    assigned_at TIMESTAMP,
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for emergency incidents
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_status ON emergency_incidents(status);
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_severity ON emergency_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_created_at ON emergency_incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_dispatcher_id ON emergency_incidents(dispatcher_id);
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_location ON emergency_incidents USING GIST(ll_to_earth(latitude, longitude));

-- Developer Accounts Table
CREATE TABLE IF NOT EXISTS developer_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user_profiles(id),
    business_name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    tier VARCHAR(50) DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
    email VARCHAR(255) NOT NULL UNIQUE,
    contact_phone VARCHAR(20),
    api_key VARCHAR(255) UNIQUE NOT NULL,
    api_secret VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP
);

-- API Usage Logs Table
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id SERIAL PRIMARY KEY,
    api_key_id VARCHAR(255) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(20),
    status_code INTEGER,
    response_time_ms INTEGER,
    request_size INTEGER,
    response_size INTEGER,
    ip_address VARCHAR(45),
    user_id INTEGER,
    tier VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for developer accounts
CREATE INDEX IF NOT EXISTS idx_developer_accounts_api_key ON developer_accounts(api_key);
CREATE INDEX IF NOT EXISTS idx_developer_accounts_tier ON developer_accounts(tier);
CREATE INDEX IF NOT EXISTS idx_developer_accounts_created_at ON developer_accounts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_developer_accounts_status ON developer_accounts(status);

-- Create indexes for API usage logs
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_key_id ON api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_tier ON api_usage_logs(tier);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user_profiles(id),
    developer_id INTEGER REFERENCES developer_accounts(id),
    amount BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    method VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    reference VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    metadata JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER REFERENCES developer_accounts(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    due_date TIMESTAMP,
    description TEXT,
    items JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    developer_id INTEGER REFERENCES developer_accounts(id) UNIQUE,
    tier VARCHAR(50) NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise')),
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
    amount BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'suspended')),
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_billing_date TIMESTAMP,
    cancelled_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_developer_id ON payments(developer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Create indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_developer_id ON invoices(developer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_developer_id ON subscriptions(developer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);

-- Government Hierarchy Table
CREATE TABLE IF NOT EXISTS government_hierarchy (
    id SERIAL PRIMARY KEY,
    level VARCHAR(50) NOT NULL CHECK (level IN ('continent', 'country', 'state', 'city', 'area')),
    parent_id INTEGER REFERENCES government_hierarchy(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    country VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Government Agents Table
CREATE TABLE IF NOT EXISTS government_agents (
    id SERIAL PRIMARY KEY,
    region_id INTEGER REFERENCES government_hierarchy(id),
    agent_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(100) NOT NULL,
    department VARCHAR(255),
    level VARCHAR(50),
    jurisdiction VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Government Metrics Table
CREATE TABLE IF NOT EXISTS government_metrics (
    id SERIAL PRIMARY KEY,
    region_id INTEGER REFERENCES government_hierarchy(id),
    metric_type VARCHAR(100) NOT NULL,
    value BIGINT,
    category VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for government hierarchy
CREATE INDEX IF NOT EXISTS idx_gov_hierarchy_level ON government_hierarchy(level);
CREATE INDEX IF NOT EXISTS idx_gov_hierarchy_parent_id ON government_hierarchy(parent_id);
CREATE INDEX IF NOT EXISTS idx_gov_hierarchy_country ON government_hierarchy(country);
CREATE INDEX IF NOT EXISTS idx_gov_hierarchy_code ON government_hierarchy(code);

-- Create indexes for government agents
CREATE INDEX IF NOT EXISTS idx_gov_agents_region_id ON government_agents(region_id);
CREATE INDEX IF NOT EXISTS idx_gov_agents_role ON government_agents(role);
CREATE INDEX IF NOT EXISTS idx_gov_agents_status ON government_agents(status);
CREATE INDEX IF NOT EXISTS idx_gov_agents_email ON government_agents(email);

-- Create indexes for government metrics
CREATE INDEX IF NOT EXISTS idx_gov_metrics_region_id ON government_metrics(region_id);
CREATE INDEX IF NOT EXISTS idx_gov_metrics_metric_type ON government_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_gov_metrics_created_at ON government_metrics(created_at DESC);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user_profiles(id),
    type VARCHAR(100) NOT NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'inapp')),
    subject VARCHAR(255),
    message TEXT,
    metadata JSONB,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'read', 'failed')),
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification Templates Table
CREATE TABLE IF NOT EXISTS notification_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    body TEXT,
    variables JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create indexes for templates
CREATE INDEX IF NOT EXISTS idx_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_channel ON notification_templates(channel);

-- Address Verification Table
CREATE TABLE IF NOT EXISTS address_verification (
    id SERIAL PRIMARY KEY,
    address_code VARCHAR(255) NOT NULL UNIQUE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    confidence DECIMAL(3, 2) DEFAULT 0,
    verification_method VARCHAR(100),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id INTEGER REFERENCES user_profiles(id),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for address verification
CREATE INDEX IF NOT EXISTS idx_address_verification_code ON address_verification(address_code);
CREATE INDEX IF NOT EXISTS idx_address_verification_status ON address_verification(status);
CREATE INDEX IF NOT EXISTS idx_address_verification_created_at ON address_verification(created_at DESC);

-- Create indexes for analytics events
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Scheduled Reports Table
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user_profiles(id),
    report_type VARCHAR(50) NOT NULL,
    filters JSONB,
    recurrence VARCHAR(50) DEFAULT 'once',
    active BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for scheduled reports
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_user_id ON scheduled_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON scheduled_reports(active);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_recurrence ON scheduled_reports(recurrence);

-- Webhooks Table
CREATE TABLE IF NOT EXISTS webhooks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user_profiles(id),
    url VARCHAR(500) NOT NULL,
    events JSONB DEFAULT '[]',
    secret VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Webhook Logs Table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id SERIAL PRIMARY KEY,
    webhook_id INTEGER REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100),
    payload JSONB,
    status_code INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(active);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
