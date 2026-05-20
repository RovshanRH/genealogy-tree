/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS nationality (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) UNIQUE NOT NULL
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
