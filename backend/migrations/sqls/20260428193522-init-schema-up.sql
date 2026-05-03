
CREATE TABLE IF NOT EXISTS person (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    surname                     VARCHAR(100) NOT NULL,
    maiden_surname              VARCHAR(100),           -- фамилия до замужества
    first_name                  VARCHAR(100) NOT NULL,
    patronymic                  VARCHAR(100),

    birth_date                  DATE,
    birth_date_approx           BOOLEAN DEFAULT false,
    
    birth_place_country_id      UUID REFERENCES country(id),
    birth_place_city_id         UUID REFERENCES city(id),
    birth_place_street          VARCHAR(200),
    birth_place_house           VARCHAR(50),
    birth_place_apartment       VARCHAR(50),

    death_date                  DATE,
    death_date_approx           BOOLEAN DEFAULT false,
    
    death_place_country_id      UUID REFERENCES country(id),
    death_place_city_id         UUID REFERENCES city(id),

    nationality_id              UUID REFERENCES nationality(id),
    social_status_id            UUID REFERENCES social_status(id),

    bio                         TEXT,
    source_info                 TEXT,

    is_person_contacted         BOOLEAN DEFAULT false,

    created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT birth_before_death CHECK (
        death_date IS NULL OR death_date >= birth_date
    )
);

create Table if not exists relations (
    father_id UUID,
    mother_id UUID,
    child_id UUID,
    Foreign Key (father_id) REFERENCES person (id),
    Foreign Key (mother_id) REFERENCES person (id),
    Foreign Key (child_id) REFERENCES person (id),
    PRIMARY KEY (
        father_id,
        mother_id,
        child_id
    )
);

CREATE INDEX if NOT exists idx_person_surname ON person (surname, maiden_surname);



