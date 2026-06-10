/* Replace with your SQL commands */
create table if not exists birth_place (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    birth_date DATE,
    birth_date_approx BOOLEAN DEFAULT false,
    birth_place_country_id UUID REFERENCES country (id),
    birth_place_city_id UUID REFERENCES city (id),
    birth_place_street UUID REFERENCES street (id),
    birth_place_house UUID REFERENCES house (id),
    birth_place_apartment UUID REFERENCES apartment (id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)