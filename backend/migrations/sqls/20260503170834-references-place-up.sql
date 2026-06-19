/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS country (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

create table if not exists region (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    country_id UUID REFERENCES country (id) ON DELETE CASCADE,
    name VARCHAR(100),
    UNIQUE (country_id, name),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)

-- 3. Города
CREATE TABLE IF NOT EXISTS city (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    region_id UUID REFERENCES region (id) ON DELETE CASCADE,
    name VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (region_id, name)
);

-- Улица
CREATE Table if not exists street (
    id UUID Primary key DEFAULT gen_random_uuid (),
    city_id UUID REFERENCES city (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(200) not null
);

CREATE Table if not exists house (
    id UUID Primary key DEFAULT gen_random_uuid (),
    street_id UUID REFERENCES street (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(50) not null
);

create table if not exists apartment (
    id UUID Primary key DEFAULT gen_random_uuid (),
    house_id UUID REFERENCES house (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(50) not null
);