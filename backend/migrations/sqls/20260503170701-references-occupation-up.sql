/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS occupation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    title VARCHAR(150),
    organization VARCHAR(200),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
