/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS occupation (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(150) NOT NULL,
    organization    VARCHAR(200),
    start_year      INTEGER,
    end_year        INTEGER
);