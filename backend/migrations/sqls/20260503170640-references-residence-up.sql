/* Replace with your SQL commands */


CREATE TABLE IF NOT EXISTS residence (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    country_id          UUID REFERENCES country(id),
    city_id             UUID REFERENCES city(id),
    street_id              uuid REFERENCES street(id),
    house_id               uuid REFERENCES house(id),
    apartment_id           uuid REFERENCES apartment(id),
    
    start_date          DATE,
    end_date            DATE,
    start_date_approx   BOOLEAN DEFAULT false,
    end_date_approx     BOOLEAN DEFAULT false,
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
-- before update on residence
-- for each row
-- EXECUTE FUNCTION auto_updated_at_trigger_func();