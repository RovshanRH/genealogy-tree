/* Replace with your SQL commands */
create table if not exists death_place (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    death_date DATE,
    death_date_approx BOOLEAN DEFAULT false,
    death_place_country_id UUID REFERENCES country (id),
    death_place_city_id UUID REFERENCES city (id),
    nationality_id UUID REFERENCES nationality (id),
    social_status_id UUID REFERENCES social_status (id)
)