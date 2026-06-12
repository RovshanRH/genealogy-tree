/* Replace with your SQL commands */
CREATE TABLE if not exists surname (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name VARCHAR(100) created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maiden_surname (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)

CREATE INDEX if NOT exists idx_person_surname ON surname (name);

CREATE INDEX if NOT exists idx_person_maiden_surname ON maiden_surname (name);

-- create or REPLACE function auto_updated_at_trigger_func()
-- returns TRIGGER
-- LANGUAGE plpgsql
-- as $$
-- BEGIN
--     NEW.updated_at = CURRENT_TIMESTAMP;
--     return NEW;
-- END;
-- $$;

-- create trigger auto_updated_at_trigger
-- before update on surname
-- for each row
-- EXECUTE FUNCTION auto_updated_at_trigger_func();

-- create trigger auto_updated_at_trigger
-- before update on maiden_surname
-- for each row
-- EXECUTE FUNCTION auto_updated_at_trigger_func();