
create table base_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

create or REPLACE function AutoSetUpdateTimeData()
returns TRIGGER
LANGUAGE plpgsql
as $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    return NEW;
END;
$$;

create trigger AutoSetUpdateTimeDataPerson
before update on base_table
for each row
EXECUTE FUNCTION AutoSetUpdateTimeData();

-- Тип Пол
CREATE TYPE gender_status as enum ('male', 'female');
-- Тип семейного положения
create type marriage_status_type as enum ('divorced', 'single', 'widowed', 'married');
-- Таблица человека
CREATE TABLE IF NOT EXISTS person (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    genealogy_tree_id uuid,
    foreign key (genealogy_tree_id) REFERENCES geneology_tree (id) on delete cascade,
    mother uuid REFERENCES person (id),
    father uuid REFERENCES person (id),
    marital_status marriage_status_type not null DEFAULT 'single',
    spouse uuid REFERENCES person (id),
    surname UUID REFERENCES surname (id),
    maidenSurname UUID REFERENCES maiden_surname (id),
    firstName VARCHAR(100) NOT NULL,
    patronymic VARCHAR(100),
    fullName VARCHAR(300),
    age INT not NULL,
    gender gender_status not NULL,
    occupation uuid REFERENCES occupation (id),
    education uuid REFERENCES education (id),
    residence uuid REFERENCES residence (id),
    nationality UUID REFERENCES nationality (id),
    socialStatus UUID REFERENCES social_status (id),
    -- birthplace
    birth_place uuid REFERENCES birth_place (id),
    -- death_place
    death_place uuid REFERENCES death_place (id),
    bio TEXT,
    source_info TEXT,
    isPersonContacted BOOLEAN DEFAULT false,
    isAlive BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
) INHERITS (base_table);
-- Таблица Отношщений
create Table if not exists relations (
    id uuid PRIMARY KEY (
        fatherId,
        motherId,
        personId,
        spouseId,
        children
    ),
    fatherId UUID REFERENCES person (id),
    motherId UUID REFERENCES person (id),
    personId UUID REFERENCES person (id),
    spouseId UUID REFERENCES person (id),
    -- children UUID [] REFERENCES person (id),
    autoNaming VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
) INHERITS (base_table);

-- Функция обновления статуса жизни
create or replace FUNCTION setAliveStatus()
returns TRIGGER
LANGUAGE plpgsql
as $$
BEGIN

    if new.death_place IS NOT null THEN
        new.isAlive = TRUE
    else
        new.isAlive = FALSE
    
    return new;

END;
$$;
-- Триггер с этой функцией
create trigger setAliveStatusTrigger
after insert or update on person
for each row
execute function setAliveStatus();
-- Валидация семейного положения
create or replace FUNCTION checkMaritalStatus()
returns TRIGGER
LANGUAGE plpgsql
as $$
BEGIN
    
    if new.spouse = null and marital_status = 'married' OR marital_status = 'widowed' THEN
        RAISE EXCEPTION 'Супруг/супруга не указан/указана, но супружеский статус является %', marital_status
    END IF;

    if new.spouse IS NOT null and marital_status = 'single' OR marital_status = 'divorced' THEN
        RAISE EXCEPTION 'Супруг/супруга указан/указана, но супружеский статус является %', marital_status

    END IF;
        
END;
$$;
-- Триггер с этой функцией
create trigger checkMaritalStatusTrigger
after insert or update or delete on person
for each row
execute FUNCTION checkMaritalStatus();

-- Самообновление relations с insert update и delete при добавлении нового человека
create or replace FUNCTION relationCRUD()
returns TRIGGER
LANGUAGE plpgsql
as $$

BEGIN
    if tg_op = 'INSERT' THEN
        INSERT INTO relations (fatherId, motherId, personId, spouseId, children) VALUES
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
        SET fatherId = new.fatherId,
            motherId = new.motherId,
            personId = new.id
        WHERE fatherId = old.fatherId 
        AND motherId = old.motherId 
        AND personId = old.personId;
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
-- Подсчет человечков для таблицы дерева
create or replace Function countCharacters()
returns TRIGGER
language plpgsql
as $$
DECLARE
    v_count_all_characters INTEGER :=0;
    v_count_all_characters_alive INTEGER :=0;
    v_count_all_characters_dead INTEGER :=0;
    -- v_count_all_characters_kids INTEGER :=0;
    v_count_all_characters_parents INTEGER :=0;
    v_count_all_characters_male INTEGER :=0;
    v_count_all_characters_female INTEGER :=0;
    -- v_count_all_characters_grandparents INTEGER;
    v_tree_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_tree_id := OLD.geneology_tree_id;
    ELSE
        v_tree_id := NEW.geneology_tree_id;
    END IF;

    SELECT count_all_characters,
            count_all_characters_alive,
            count_all_characters_dead,
            count_all_characters_male,
            count_all_characters_female,
            -- count_all_characters_kids,
            count_all_characters_parents
    INTO v_count_all_characters,
            v_count_all_characters_alive,
            v_count_all_characters_dead,
            v_count_all_characters_male,
            v_count_all_characters_female,
            -- v_count_all_characters_kids,
            v_count_all_characters_parents
    FROM geneology_tree
    WHERE id = v_tree_id;

    if tg_op = 'INSERT' THEN

        v_count_all_characters := v_count_all_characters + 1;


        if NEW.isAlive is TRUE THEN
            v_count_all_characters_alive := v_count_all_characters_alive + 1;
        ELSE
            v_count_all_characters_dead := v_count_all_characters_dead + 1;
        end if;
        
        if new.gender = 'male' THEN
            v_count_all_characters_male := v_count_all_characters_male + 1;
        end if;
        if new.gender = 'female' THEN
            v_count_all_characters_female := v_count_all_characters_female + 1;
        end if;

        -- if new. IS NOT null then 
        --     v_count_all_characters_kids := v_count_all_characters_kids + 1;
        -- end if;
        if new.father IS NOT null then 
            v_count_all_characters_parents := v_count_all_characters_parents + 1;
        end if;
        if new.mother IS NOT null then 
            v_count_all_characters_parents := v_count_all_characters_parents + 1;

        

    end if;

    if tg_op = 'UPDATE' THEN

        if new.isAlive is FALSE and old.isAlive is TRUE THEN
            v_count_all_characters_alive := v_count_all_characters_alive - 1;
            v_count_all_characters_dead := v_count_all_characters_dead + 1;

        end if;

        if new.isAlive is TRUE and old.isAlive is FALSE THEN
            v_count_all_characters_alive := v_count_all_characters_alive + 1;
            v_count_all_characters_dead := v_count_all_characters_dead - 1;

        end if;

        if OLD.gender = 'male' and new.gender = 'female' THEN
            v_count_all_characters_female := v_count_all_characters_female + 1;
            v_count_all_characters_male := v_count_all_characters_male - 1;
        end if;

        if OLD.gender = 'female' and new.gender = 'male' THEN
            v_count_all_characters_female := v_count_all_characters_female - 1;
            v_count_all_characters_male := v_count_all_characters_male + 1;

        end if;

        if old.mother is null and new.mother IS NOT null THEN
            v_count_all_characters_parents := v_count_all_characters_parents + 1;
        end if;

        if old.father IS null and new.father IS NOT null THEN
            v_count_all_characters_parents := v_count_all_characters_parents + 1;
        end if;

        if old.mother IS NOT null and new.mother is null THEN
            v_count_all_characters_parents := v_count_all_characters_parents - 1;
        end if;

        if old.father IS NOT null and new.father is null THEN
            v_count_all_characters_parents := v_count_all_characters_parents - 1;
        end if;

        
    end if;


    if tg_op = 'DELETE' THEN

        -- v_count_all_characters := v_count_all_characters - 1;

        if OLD.isAlive is TRUE THEN
            v_count_all_characters_alive := v_count_all_characters_alive - 1;
        ELSE
            v_count_all_characters_dead := v_count_all_characters_dead - 1;
        end if;
        
        if OLD.gender = 'male' THEN
            v_count_all_characters_male := v_count_all_characters_male - 1;
        end if;
        if OLD.gender = 'female' THEN
            v_count_all_characters_female := v_count_all_characters_female - 1;
        end if;

        -- if new.personId IS NOT null then 
        --     v_count_all_characters_kids := v_count_all_characters_kids - 1;
        -- end if;
        if new.fatherId IS NOT null then 
            v_count_all_characters_parents := v_count_all_characters_parents - 1;
        end if;
        if new.motherId IS NOT null then 
            v_count_all_characters_parents := v_count_all_characters_parents - 1;
        end if;

        
        
    end if;

    v_count_all_characters := GREATEST(v_count_all_characters, 0);
    v_count_all_characters_alive := GREATEST(v_count_all_characters_alive, 0);
    v_count_all_characters_dead := GREATEST(v_count_all_characters_dead, 0);
    v_count_all_characters_male := GREATEST(v_count_all_characters_male, 0);
    v_count_all_characters_female := GREATEST(v_count_all_characters_female, 0);
    v_count_all_characters_parents := GREATEST(v_count_all_characters_parents, 0);

    UPDATE geneology_tree
        SET count_all_characters = v_count_all_characters,
            count_all_characters_alive = v_count_all_characters_alive,
            count_all_characters_dead = v_count_all_characters_dead,
            count_all_characters_male = v_count_all_characters_male,
            count_all_characters_female = v_count_all_characters_female,
            -- count_all_characters_kids = v_count_all_characters_kids,
            count_all_characters_parents = v_count_all_characters_parents
        where id = v_tree_id;

    
    
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