/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS social_status (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) UNIQUE NOT NULL,   -- "Крестьянин", "Дворянин", "Рабочий", "Интеллигенция" и т.д.
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);