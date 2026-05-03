/* Replace with your SQL commands */


CREATE TABLE IF NOT EXISTS residence (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id           UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    
    country_id          UUID REFERENCES country(id),
    city_id             UUID REFERENCES city(id),
    street              VARCHAR(200),
    house               VARCHAR(50),
    apartment           VARCHAR(50),
    
    start_date          DATE,
    end_date            DATE,
    start_date_approx   BOOLEAN DEFAULT false,
    end_date_approx     BOOLEAN DEFAULT false
);