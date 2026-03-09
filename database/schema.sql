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
    country_code VARCHAR(3) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    UNIQUE(country_code)
);

CREATE TABLE IF NOT EXISTS states (
    id SERIAL PRIMARY KEY,
    country_id INTEGER REFERENCES countries(id),
    state_name VARCHAR(100) NOT NULL,
    state_code VARCHAR(5) NOT NULL,
    UNIQUE(country_id, state_code)
);

CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    state_id INTEGER REFERENCES states(id),
    country_id INTEGER REFERENCES countries(id),
    city_name VARCHAR(100) NOT NULL,
    city_code VARCHAR(3) NOT NULL UNIQUE,
    min_latitude DECIMAL(10, 8) NOT NULL,
    max_latitude DECIMAL(10, 8) NOT NULL,
    min_longitude DECIMAL(11, 8) NOT NULL,
    max_longitude DECIMAL(11, 8) NOT NULL,
    boundary GEOMETRY(POLYGON, 4326),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    city_code VARCHAR(3) REFERENCES cities(city_code),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location GEOMETRY(POINT, 4326),
    country VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_addresses_location ON addresses USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_addresses_code ON addresses(code);
CREATE INDEX IF NOT EXISTS idx_cities_boundary ON cities USING GIST(boundary);

INSERT INTO continents (name, code)
VALUES ('Africa', 'AFR')
ON CONFLICT (code) DO NOTHING;

INSERT INTO countries (continent_id, country_name, country_code, is_active)
VALUES (1, 'Nigeria', 'NGA', true)
ON CONFLICT (country_code) DO NOTHING;

INSERT INTO states (country_id, state_name, state_code) VALUES
(1, 'Lagos State', 'LA'),
(1, 'Federal Capital Territory', 'FC'),
(1, 'Oyo State', 'OY'),
(1, 'Rivers State', 'RI'),
(1, 'Kano State', 'KN')
ON CONFLICT (country_id, state_code) DO NOTHING;

INSERT INTO cities (state_id, country_id, city_name, city_code, min_latitude, max_latitude, min_longitude, max_longitude, boundary, is_active)
VALUES (
    1, 1, 'Lagos', 'LAG',
    6.4000, 6.7000, 3.2000, 3.6000,
    ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(3.2 6.4, 3.6 6.4, 3.6 6.7, 3.2 6.7, 3.2 6.4)')), 4326),
    true
)
ON CONFLICT (city_code) DO NOTHING;

INSERT INTO cities (state_id, country_id, city_name, city_code, min_latitude, max_latitude, min_longitude, max_longitude, boundary, is_active)
VALUES (
    2, 1, 'Abuja', 'ABJ',
    8.9000, 9.2000, 7.1000, 7.5000,
    ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(7.1 8.9, 7.5 8.9, 7.5 9.2, 7.1 9.2, 7.1 8.9)')), 4326),
    false
)
ON CONFLICT (city_code) DO NOTHING;

INSERT INTO cities (state_id, country_id, city_name, city_code, min_latitude, max_latitude, min_longitude, max_longitude, boundary, is_active)
VALUES (
    3, 1, 'Ibadan', 'IBD',
    7.3000, 7.5000, 3.8000, 4.0000,
    ST_SetSRID(ST_MakePolygon(ST_GeomFromText('LINESTRING(3.8 7.3, 4.0 7.3, 4.0 7.5, 3.8 7.5, 3.8 7.3)')), 4326),
    false
)
ON CONFLICT (city_code) DO NOTHING;