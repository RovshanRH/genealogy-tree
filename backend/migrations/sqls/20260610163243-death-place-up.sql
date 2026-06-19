/* Replace with your SQL commands */
create table if not exists death_place (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    death_date DATE,
    death_date_approx BOOLEAN DEFAULT false,
    cause_of_death TEXT,
    death_place_country_id UUID REFERENCES country (id) ON DELETE SET NULL,
    death_place_city_id UUID REFERENCES city (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)