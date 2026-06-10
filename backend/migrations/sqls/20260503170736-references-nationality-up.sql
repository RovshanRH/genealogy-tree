/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS nationality (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) UNIQUE,
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
before update on nationality
for each row
EXECUTE FUNCTION auto_updated_at_trigger_func();