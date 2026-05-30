/* Replace with your SQL commands */
CREATE TABLE if not exists surname (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS maiden_surname (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100)
)

CREATE INDEX if NOT exists idx_person_surname ON surname (name);
CREATE INDEX if NOT exists idx_person_maiden_surname ON maiden_surname (name);