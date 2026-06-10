/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS education (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution     VARCHAR(200),
    degree          VARCHAR(100),           -- высшее, среднее-специальное и т.д.
    specialty       VARCHAR(150),
    year_start      INTEGER,
    year_end        INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

create or REPLACE function auto_updated_at_trigger_func()
returns TRIGGER
LANGUAGE plpgsql
as $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    return NEW;
END;
$$;

create trigger auto_updated_at_trigger
before update on education
for each row
EXECUTE FUNCTION auto_updated_at_trigger_func();


