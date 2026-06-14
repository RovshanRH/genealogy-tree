/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS education (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution     VARCHAR(200),
    degree          VARCHAR(100),
    specialty       VARCHAR(150),
    year_start      INTEGER,
    year_end        INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


