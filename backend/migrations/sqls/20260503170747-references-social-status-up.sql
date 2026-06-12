/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS social_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name VARCHAR(100) UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

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
-- before update on social_status
-- for each row
-- EXECUTE FUNCTION auto_updated_at_trigger_func();