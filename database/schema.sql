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
ADD COLUMN IF NOT EXISTS created_at TIMESTAMfeatures for mobile optimization.P DEFAULT CURRENT_TIMESTAMP;

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

