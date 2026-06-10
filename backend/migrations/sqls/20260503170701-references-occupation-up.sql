/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS occupation (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(150),
    organization    VARCHAR(200),
    start_year      INTEGER,
    end_year        INTEGER,
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
before update on occupation
for each row
EXECUTE FUNCTION auto_updated_at_trigger_func();