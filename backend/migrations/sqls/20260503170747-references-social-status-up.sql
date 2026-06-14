/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS social_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name VARCHAR(100) UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);