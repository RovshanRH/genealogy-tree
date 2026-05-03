/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS country (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) UNIQUE NOT NULL,   -- "Россия", "Украина", "Польша"
    name_en     VARCHAR(100),
    iso_code    VARCHAR(3),                     -- RUS, UKR, POL
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Города
CREATE TABLE IF NOT EXISTS city (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id  UUID NOT NULL REFERENCES country(id) ON DELETE RESTRICT,
    name        VARCHAR(150) NOT NULL,
    name_en     VARCHAR(150),
    region      VARCHAR(100),                   -- область, штат и т.д.
    UNIQUE(country_id, name)
);