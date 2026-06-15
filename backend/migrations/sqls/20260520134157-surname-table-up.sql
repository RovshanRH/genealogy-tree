/* Replace with your SQL commands */
CREATE TABLE if not exists surname (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maiden_surname (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)

