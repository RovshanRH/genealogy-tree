
create Table if NOT exists person (
    id SERIAL PRIMARY KEY,
    surname TEXT NOT NULL,
    mother_surname TEXT,
    name TEXT NOT NULL,
    patronymic TEXT,
    birth_date DATE NOT NULL,
    is_birth_date_accurate BOOLEAN,
    birth_place TEXT,
    death_date DATE,
    nationality TEXT NOT NULL,
    social_status TEXT,
    education TEXT,
    occupation TEXT NOT NULL,
    residence TEXT NOT NULL,
    residence_time TEXT,
    how_was_obtained_information TEXT,
    bio TEXT,
    is_person_contacted BOOLEAN,

    CONSTRAINT birth_before_death CHECK (
        death_date IS NULL OR death_date >= birth_date
    

    )

);

create Table if not exists relations (
    father_id INT,
    mother_id INT,
    child_id INT,
    Foreign Key (father_id) REFERENCES person (id),
    Foreign Key (mother_id) REFERENCES person (id),
    Foreign Key (child_id) REFERENCES person (id),
    PRIMARY KEY (
        father_id,
        mother_id,
        child_id
    )
);

CREATE INDEX if NOT exists idx_person_surname ON person (surname, mother_surname);

create TABLE if not exists user (
    username VARCHAR(20),
    email UNIQUE VARCHAR(30),
    password VARCHAR(100)
);
