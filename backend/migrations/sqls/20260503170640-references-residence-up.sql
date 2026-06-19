/* Replace with your SQL commands */

CREATE TABLE IF NOT EXISTS residence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    country UUID REFERENCES country (id) ON DELETE SET NULL,
    city UUID REFERENCES city (id) ON DELETE SET NULL,
    street uuid REFERENCES street (id) ON DELETE SET NULL,
    house uuid REFERENCES house (id) ON DELETE SET NULL,
    apartment uuid REFERENCES apartment (id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);