-- create table base_table (
--     -- id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- create or REPLACE function AutoSetUpdateTimeData()
-- returns TRIGGER
-- LANGUAGE plpgsql
-- as $$
-- BEGIN
--     NEW.updated_at = CURRENT_TIMESTAMP;
--     return NEW;
-- END;
-- $$;

-- create trigger AutoSetUpdateTimeDataPerson
-- before update on base_table
-- for each row
-- EXECUTE FUNCTION AutoSetUpdateTimeData();

-- Тип Пол
CREATE TYPE gender_status as enum ('male', 'female');
-- Тип семейного положения
create type marriage_status_type as enum ('divorced', 'single', 'widowed', 'married');
-- Таблица человека
CREATE TABLE IF NOT EXISTS person (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    genealogy_tree_id uuid,
    foreign key (genealogy_tree_id) REFERENCES genealogy_tree (id) on delete cascade,
    mother uuid REFERENCES person (id) ON DELETE SET NULL,
    father uuid REFERENCES person (id) ON DELETE SET NULL,
    spouse uuid REFERENCES person (id) ON DELETE SET NULL,

    marital_status marriage_status_type not null DEFAULT 'single',
    -- Фамилия
    surname UUID REFERENCES surname (id) ON DELETE SET NULL,
    -- Девичья Фамилия
    maidenSurname UUID REFERENCES maiden_surname (id) ON DELETE SET NULL,
    firstName VARCHAR(200) NOT NULL,
    patronymic VARCHAR(200),
    fullName VARCHAR(500),
    age INT not NULL,
    gender gender_status not NULL,
    -- все работы
    -- person_occupations uuid REFERENCES person_occupations (id),
    -- все учебы
    -- person_educations uuid REFERENCES person_educations (id),
    -- все жилища
    -- person_residentials uuid REFERENCES person_residentials (id),
    -- адреса
    fullAddress VARCHAR(1000) [],
    cityAddress VARCHAR(1000) [],
    -- национальность
    nationality UUID REFERENCES nationality (id) ON DELETE SET NULL,
    -- социальный статус
    socialStatus UUID REFERENCES social_status (id) ON DELETE SET NULL,
    -- birthplace
    birth_place uuid REFERENCES birth_place (id) ON DELETE SET NULL,
    -- death_place
    death_place uuid REFERENCES death_place (id) ON DELETE SET NULL,
    bio TEXT,
    source_info TEXT,
    isPersonContacted BOOLEAN DEFAULT false,
    isAlive BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)

alter Table person
add CONSTRAINT chk_maiden_surname CHECK (
    (
        gender = 'female'
        AND spouse IS NOT NULL
        AND maidenSurname IS NOT NULL
    )
    OR (
        gender != 'female'
        AND maidenSurname IS NULL
    )
)

create table if not exists person_occupations (
    id uuid PRIMARY key DEFAULT gen_random_uuid (),
    person_id uuid REFERENCES person (id) ON DELETE CASCADE,
    occupation_id uuid REFERENCES occupation (id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    is_primary BOOLEAN DEFAULT FALSE
)

create table if not exists person_educations (
    id uuid PRIMARY key DEFAULT gen_random_uuid (),
    person_id uuid REFERENCES person (id) ON DELETE CASCADE,
    education_id uuid REFERENCES education (id) ON DELETE CASCADE,
    entry_year INT,
    graduation_year INT
)

create table if not exists person_residentials (
    id uuid PRIMARY key DEFAULT gen_random_uuid (),
    person_id uuid REFERENCES person (id) ON DELETE CASCADE,
    residence_id uuid REFERENCES residence (id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    start_date_approx BOOLEAN DEFAULT false,
    end_date_approx BOOLEAN DEFAULT false,
    is_current BOOLEAN DEFAULT FALSE
)

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_updated_at
    BEFORE UPDATE ON person
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

create index if not exists idx_person_fullName on person (fullName);

create index if not exists idx_person_cityAddress on person (cityAddress);

-- Таблица Отношщений
create Table if not exists relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    fatherId UUID REFERENCES person (id) ON DELETE CASCADE,
    motherId UUID REFERENCES person (id) ON DELETE CASCADE,
    personId UUID REFERENCES person (id) ON DELETE CASCADE,
    spouseId UUID REFERENCES person (id) ON DELETE CASCADE,
    autoNaming VARCHAR(50),
    UNIQUE (
        fatherId,
        motherId,
        personId,
        spouseId
    ),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)


-- Функция обновления статуса жизни
create or replace FUNCTION setAliveStatus()
returns TRIGGER
LANGUAGE plpgsql
as $$
BEGIN

    if new.death_place IS NOT null THEN
        new.isAlive := TRUE;
    else
        new.isAlive := FALSE;
    end if;
    
    return new;

END;
$$;
-- Триггер с этой функцией
create trigger setAliveStatusTrigger
after insert or update on person
for each row
execute function setAliveStatus();
-- Валидация семейного положения
CREATE OR REPLACE FUNCTION checkMaritalStatus()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.spouse IS NOT NULL AND (NEW.marital_status = 'single' OR NEW.marital_status = 'divorced') THEN
        RAISE EXCEPTION 'Супруг/супруга указан/указана, но супружеский статус является "%"', NEW.marital_status;
    END IF;
    
    IF NEW.spouse IS NULL AND (NEW.marital_status = 'married' OR NEW.marital_status = 'widowed') THEN
        RAISE EXCEPTION 'Супруг/супруга не указан/указана, но супружеский статус является "%"', NEW.marital_status;
    END IF;
    
    RETURN NEW;
END;
$$;
-- Триггер с этой функцией
create trigger checkMaritalStatusTrigger
after insert or update or delete on person
for each row
execute FUNCTION checkMaritalStatus();

CREATE or REPLACE FUNCTION fullNameCreater(first_name VARCHAR(100), last_name VARCHAR(100), patronymic VARCHAR(100))
returns VARCHAR(300)
language plpgsql
as $$
DECLARE
    full_name VARCHAR(300);
BEGIN
    if first_name is NULL THEN
        raise EXCEPTION 'Имя отсутсвует';
    end if;

    full_name := last_name + ' ' + first_name + ' ' + patronymic;

    RETURN full_name;

END;
$$;

create or REPLACE FUNCTION fullAddressCreater(residence_id UUID)
RETURNS VARCHAR[]
language plpgsql
as $$

DECLARE
    
    v_country_name VARCHAR(100);
    v_region_name VARCHAR(100);
    v_city_name VARCHAR(150);
    v_street_name VARCHAR(200);
    v_house_name VARCHAR(50);
    v_apartment_name VARCHAR(50);
    v_residence_record record;

    fullAddress VARCHAR(1000);
    cityAddress VARCHAR(800);

BEGIN
    SELECT 
        c.name AS country_name,
        r.name AS region_name,
        ct.name AS city_name,
        s.name AS street_name,
        h.name AS house_name,
        a.name AS apartment_name
    INTO 
        v_country_name,
        v_region_name,
        v_city_name,
        v_street_name,
        v_house_name,
        v_apartment_name
    FROM residence res
    LEFT JOIN country c ON c.id = res.country
    LEFT JOIN region r ON r.country_id = res.country
    LEFT JOIN city ct ON ct.id = res.city
    LEFT JOIN street s ON s.id = res.street
    LEFT JOIN house h ON h.id = res.house
    LEFT JOIN apartment a ON a.id = res.apartment
    WHERE res.id = residence_id;

    fullAddress := concat_ws(', ', concat('Страна: ', v_country_name), concat('Регион: ', v_region_name), concat('г. ', v_city_name), concat('ул. ', v_street_name), v_house_name, v_apartment_name);

    cityAddress := concat_ws(', ', concat('г. ', v_city_name), concat('ул. ', v_street_name), v_house_name, v_apartment_name);

    RETURN ARRAY[fullAddress, cityAddress];

END;
$$;

create or replace FUNCTION autoFillingRows()
RETURNS TRIGGER
language plpgsql
as $$
DECLARE
    v_surname_name VARCHAR(50);
    v_address_data varchar[];
    v_residential_addresses uuid[];
    v_residence_record RECORD;
BEGIN
    SELECT name into v_surname_name FROM surname where id = new.surname;

    new.fullName := fullNameCreater(new.first_name, v_surname_name, new.patronymic);

    SELECT ARRAY_AGG(residence_id) INTO v_residential_addresses from person_residentials where person_id = new.id;

    -- FOREACH x in array v_residential_addresses
    -- LOOP
    --    v_addresses := v_addresses || fullAddressCreater(x);

    --     new.fullAddress := new.fullAddress || v_addresses[1];
    --     new.cityAddress := new.cityAddress || v_addresses[2];

    --     v_addresses := ARRAY[]::VARCHAR[];

    -- END LOOP;

    IF v_residential_addresses IS NOT NULL THEN
        FOR v_residence_record IN 
            SELECT residence_id FROM person_residentials 
            WHERE person_id = NEW.id
        LOOP
            -- Получаем данные адреса (предполагаем, что функция возвращает массив)
            v_address_data := fullAddressCreater(v_residence_record.residence_id);
            
            -- Добавляем адреса в массивы
            IF array_length(v_address_data, 1) >= 1 THEN
                NEW.full_address := NEW.full_address || v_address_data[1];
            END IF;
            
            IF array_length(v_address_data, 1) >= 2 THEN
                NEW.city_address := NEW.city_address || v_address_data[2];
            END IF;
        END LOOP;
    END IF;

    return new;

END;
$$;

create trigger autoFillingRowsTrigger
after insert or update on person
for each row
EXECUTE FUNCTION autoFillingRows();

-- Самообновление relations с insert update и delete при добавлении нового человека
create or replace FUNCTION relationCRUD()
returns TRIGGER
LANGUAGE plpgsql
as $$

BEGIN
    if tg_op = 'INSERT' THEN
        INSERT INTO relations (fatherId, motherId, personId, spouseId) VALUES
        (
            new.father,
            new.mother,
            new.id,
            new.spouse
        );
    end if;
    if tg_op = 'DELETE' THEN
        DELETE FROM relations where fatherId=new.fatherId and motherId=new.motherId and personId = new.id;
    end if;
    if tf_op = 'UPDATE' THEN
        UPDATE relations
        SET fatherId = new.father,
            motherId = new.mother,
            personId = new.id,
            spouseId = new.spouse
        WHERE fatherId = old.father 
        AND motherId = old.mother
        AND personId = old.person;
    end if;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
        
END;
$$;
-- Триггер с этой функцией
CREATE TRIGGER relationCRUDTrigger
AFTER INSERT OR DELETE OR UPDATE ON person
FOR EACH ROW
EXECUTE FUNCTION relationCRUD();

-- create FUNCTION countKids()
-- RETURNS INTEGER
-- language plpgsql
-- as $$
-- DECLARE
--     v_count_all_kids INTEGER := 0;
-- BEGIN

-- END;
-- $$;

-- Подсчет человечков для таблицы дерева
CREATE OR REPLACE FUNCTION countCharacters()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count_all_characters INTEGER := 0;
    v_count_all_characters_alive INTEGER := 0;
    v_count_all_characters_dead INTEGER := 0;
    v_count_all_characters_kids INTEGER := 0;
    v_count_all_characters_parents INTEGER := 0;
    v_count_all_characters_male INTEGER := 0;
    v_count_all_characters_female INTEGER := 0;
    v_tree_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_tree_id := OLD.genealagy_tree_id;
    ELSE
        v_tree_id := NEW.genealagy_tree_id;
    END IF;

    SELECT count_all_characters,
            count_all_characters_alive,
            count_all_characters_dead,
            count_all_characters_male,
            count_all_characters_female,
            count_all_characters_kids,
            count_all_characters_parents
    INTO v_count_all_characters,
            v_count_all_characters_alive,
            v_count_all_characters_dead,
            v_count_all_characters_male,
            v_count_all_characters_female,
            v_count_all_characters_kids,
            v_count_all_characters_parents
    FROM genealagy_tree
    WHERE id = v_tree_id;

    IF TG_OP = 'INSERT' THEN
        v_count_all_characters := v_count_all_characters + 1;

        IF NEW.isAlive IS TRUE THEN
            v_count_all_characters_alive := v_count_all_characters_alive + 1;
        ELSE
            v_count_all_characters_dead := v_count_all_characters_dead + 1;
        END IF;
        
        IF NEW.gender = 'male' THEN
            v_count_all_characters_male := v_count_all_characters_male + 1;
        ELSIF NEW.gender = 'female' THEN
            v_count_all_characters_female := v_count_all_characters_female + 1;
        END IF;

        IF NEW.father IS NOT NULL THEN 
            v_count_all_characters_parents := v_count_all_characters_parents + 1;
        END IF;
        IF NEW.mother IS NOT NULL THEN 
            v_count_all_characters_parents := v_count_all_characters_parents + 1;
        END IF;

        IF NEW.mother IS NOT NULL AND NEW.father IS NOT NULL THEN
            v_count_all_characters_kids := v_count_all_characters_kids + 1;
        END IF;
    END IF;

    -- Обработка UPDATE
    IF TG_OP = 'UPDATE' THEN
        IF NEW.isAlive IS FALSE AND OLD.isAlive IS TRUE THEN
            v_count_all_characters_alive := v_count_all_characters_alive - 1;
            v_count_all_characters_dead := v_count_all_characters_dead + 1;
        END IF;

        IF NEW.isAlive IS TRUE AND OLD.isAlive IS FALSE THEN
            v_count_all_characters_alive := v_count_all_characters_alive + 1;
            v_count_all_characters_dead := v_count_all_characters_dead - 1;
        END IF;

        -- Изменение пола
        IF OLD.gender = 'male' AND NEW.gender = 'female' THEN
            v_count_all_characters_female := v_count_all_characters_female + 1;
            v_count_all_characters_male := v_count_all_characters_male - 1;
        END IF;

        IF OLD.gender = 'female' AND NEW.gender = 'male' THEN
            v_count_all_characters_female := v_count_all_characters_female - 1;
            v_count_all_characters_male := v_count_all_characters_male + 1;
        END IF;

        IF OLD.mother IS NULL AND NEW.mother IS NOT NULL THEN
            v_count_all_characters_parents := v_count_all_characters_parents + 1;
        END IF;

        IF OLD.father IS NULL AND NEW.father IS NOT NULL THEN
            v_count_all_characters_parents := v_count_all_characters_parents + 1;
        END IF;

        IF OLD.mother IS NOT NULL AND NEW.mother IS NULL THEN
            v_count_all_characters_parents := v_count_all_characters_parents - 1;
        END IF;

        IF OLD.father IS NOT NULL AND NEW.father IS NULL THEN
            v_count_all_characters_parents := v_count_all_characters_parents - 1;
        END IF;

        IF OLD.mother IS NOT NULL AND OLD.father IS NOT NULL AND 
           (NEW.mother IS NULL OR NEW.father IS NULL) THEN
            v_count_all_characters_kids := v_count_all_characters_kids - 1;
        END IF;

        IF (OLD.mother IS NULL OR OLD.father IS NULL) AND 
           NEW.mother IS NOT NULL AND NEW.father IS NOT NULL THEN
            v_count_all_characters_kids := v_count_all_characters_kids + 1;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        v_count_all_characters := v_count_all_characters - 1;

        IF OLD.isAlive IS TRUE THEN
            v_count_all_characters_alive := v_count_all_characters_alive - 1;
        ELSE
            v_count_all_characters_dead := v_count_all_characters_dead - 1;
        END IF;
        
        IF OLD.gender = 'male' THEN
            v_count_all_characters_male := v_count_all_characters_male - 1;
        ELSIF OLD.gender = 'female' THEN
            v_count_all_characters_female := v_count_all_characters_female - 1;
        END IF;

        IF OLD.father IS NOT NULL THEN 
            v_count_all_characters_parents := v_count_all_characters_parents - 1;
        END IF;
        IF OLD.mother IS NOT NULL THEN 
            v_count_all_characters_parents := v_count_all_characters_parents - 1;
        END IF;

        IF OLD.mother IS NOT NULL AND OLD.father IS NOT NULL THEN
            v_count_all_characters_kids := v_count_all_characters_kids - 1;
        END IF;
    END IF;

    v_count_all_characters := GREATEST(v_count_all_characters, 0);
    v_count_all_characters_alive := GREATEST(v_count_all_characters_alive, 0);
    v_count_all_characters_dead := GREATEST(v_count_all_characters_dead, 0);
    v_count_all_characters_male := GREATEST(v_count_all_characters_male, 0);
    v_count_all_characters_female := GREATEST(v_count_all_characters_female, 0);
    v_count_all_characters_parents := GREATEST(v_count_all_characters_parents, 0);
    v_count_all_characters_kids := GREATEST(v_count_all_characters_kids, 0);

    UPDATE genealagy_tree
    SET count_all_characters = v_count_all_characters,
        count_all_characters_alive = v_count_all_characters_alive,
        count_all_characters_dead = v_count_all_characters_dead,
        count_all_characters_male = v_count_all_characters_male,
        count_all_characters_female = v_count_all_characters_female,
        count_all_characters_kids = v_count_all_characters_kids,
        count_all_characters_parents = v_count_all_characters_parents
    WHERE id = v_tree_id;

    -- Для INSERT/UPDATE возвращаем NEW, для DELETE возвращаем OLD
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;
-- Триггер с этой функцией
create or REPLACE TRIGGER countCharactersTrigger
after insert or update or delete on person
for each row
EXECUTE FUNCTION countCharacters();
-- Функция для обновления update статуса

-- Триггер с этой функцией

-- Триггер с этой функцией

-- create trigger AutoSetUpdateTimeDataRelations
-- before update on relations
-- for each row
-- EXECUTE FUNCTION AutoSetUpdateTimeData();