/* Replace with your SQL commands */

CREATE TABLE IF NOT EXISTS residence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    country UUID REFERENCES country (id),
    city UUID REFERENCES city (id),
    street uuid REFERENCES street (id),
    house uuid REFERENCES house (id),
    apartment uuid REFERENCES apartment (id),
    start_date DATE,
    end_date DATE,
    start_date_approx BOOLEAN DEFAULT false,
    end_date_approx BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);