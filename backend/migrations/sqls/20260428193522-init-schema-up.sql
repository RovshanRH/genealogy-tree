CREATE TYPE gender_status as enum ('male', 'female');

create type marrige_status_type as enum ('divorced', 'undivorced');

CREATE TABLE IF NOT EXISTS person (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    geneology_tree_id uuid REFERENCES geneology_tree (id),
    surname UUID REFERENCES surname (id),
    maiden_surname UUID REFERENCES maiden_surname (id),
    first_name VARCHAR(100) NOT NULL,
    patronymic VARCHAR(100),
    gender gender_status not NULL,
    birth_date DATE,
    birth_date_approx BOOLEAN DEFAULT false,
    birth_place_country_id UUID REFERENCES country (id),
    birth_place_city_id UUID REFERENCES city (id),
    birth_place_street UUID REFERENCES street (id),
    birth_place_house UUID REFERENCES house (id),
    birth_place_apartment UUID REFERENCES apartment (id),
    death_date DATE,
    death_date_approx BOOLEAN DEFAULT false,
    death_place_country_id UUID REFERENCES country (id),
    death_place_city_id UUID REFERENCES city (id),
    nationality_id UUID REFERENCES nationality (id),
    social_status_id UUID REFERENCES social_status (id),
    bio TEXT,
    source_info TEXT,
    is_person_contacted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT birth_before_death CHECK (
        death_date IS NULL
        OR death_date >= birth_date
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
    ),
    marrige_status marrige_status_type not null
);

create or replace Function count_characters_trigger_func()
returns TRIGGER
language plpgsql
as $$
DECLARE
    v_count_all_characters INTEGER :=0;
    v_count_all_characters_alive INTEGER :=0;
    v_count_all_characters_dead INTEGER :=0;
    -- v_count_all_characters_kids INTEGER;
    -- v_count_all_characters_parents I :=0NTEGER;
    v_count_all_characters_male INTEGER;
    v_count_all_characters_female INTEGER :=0;
    -- v_count_all_characters_grandparents INTEGER;
    v_tree_id UUID;
BEGIN
    if tg_op = 'INSERT' THEN
        v_tree_id := new.geneology_tree_id;

        SELECT count_all_characters,
               count_all_characters_alive,
               count_all_characters_dead,
               count_all_characters_male,
               count_all_characters_female
        INTO v_count_all_characters,
             v_count_all_characters_alive,
             v_count_all_characters_dead,
             v_count_all_characters_male,
             v_count_all_characters_female
        FROM geneology_tree
        WHERE id = v_tree_id;

        v_count_all_characters := v_count_all_characters + 1;


        if NEW.death_date is NULL THEN
            v_count_all_characters_alive := v_count_all_characters_alive + 1;
        ELSE
            v_count_all_characters_alive := v_count_all_characters_alive - 1;
            v_count_all_characters_dead := v_count_all_characters_dead + 1;
        end if;
        
        if new.gender = 'male' THEN
            v_count_all_characters_male := v_count_all_characters_male + 1;
        end if;
        if new.gender = 'female' THEN
            v_count_all_characters_female := v_count_all_characters_female + 1;
        end if;

        UPDATE geneology_tree
        SET count_all_characters = v_count_all_characters,
            count_all_characters_alive = v_count_all_characters_alive,
            count_all_characters_dead = v_count_all_characters_dead,
            count_all_characters_male = v_count_all_characters_male,
            count_all_characters_female = v_count_all_characters_female,
            updated_at = NOW()
        where id = v_tree_id;

    end if;

    if tg_op = 'DELETE' THEN

        v_tree_id := new.geneology_tree_id;

        SELECT count_all_characters,
               count_all_characters_alive,
               count_all_characters_dead,
               count_all_characters_male,
               count_all_characters_female
        INTO v_count_all_characters,
             v_count_all_characters_alive,
             v_count_all_characters_dead,
             v_count_all_characters_male,
             v_count_all_characters_female
        FROM geneology_tree
        WHERE id = v_tree_id;

        v_count_all_characters := v_count_all_characters - 1;
        if OLD.death_date is NULL THEN
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

        UPDATE geneology_tree
        SET count_all_characters = v_count_all_characters,
            count_all_characters_alive = v_count_all_characters_alive,
            count_all_characters_dead = v_count_all_characters_dead,
            count_all_characters_male = v_count_all_characters_male,
            count_all_characters_female = v_count_all_characters_female,
            updated_at = now()
        where id = v_tree_id;
        
    end if;

    
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END; 
$$;

CREATE TRIGGER count_characters_trigger
AFTER INSERT OR DELETE ON person
FOR EACH ROW
EXECUTE FUNCTION count_characters_trigger_func();

create or replace Function count_related_characters_trigger_func() 
returns TRIGGER
language plpgsql
as $$
DECLARE
    v_count_all_characters_kids INTEGER;
    v_count_all_characters_parents INTEGER;
    v_tree_id UUID;
    -- v_count_all_characters_grandparents INTEGER;
BEGIN
    if tg_op = 'INSERT' THEN
        select 
            count_all_characters_kids,
            count_all_characters_parents
        from geneology_tree
        where id = v_tree_id;


        if new.child_id is not null then 
            v_count_all_characters_kids := v_count_all_characters_kids + 1;
        end if;
        if new.father_id is not null then 
            v_count_all_characters_parents := v_count_all_characters_parents + 1;
        end if;
        if new.mother_id is not null then 
            v_count_all_characters_parents := v_count_all_characters_parents + 1;

        update geneology_tree
        set count_all_characters_kids = v_count_all_characters_kids,
            count_all_characters_parents = v_count_all_characters_parents,
            updated_at = NOW()
        where id = v_tree_id;
        

        end if;
    end if;
    if tg_op = 'DELETE' THEN
        select 
            count_all_characters_kids,
            count_all_characters_parents
        from geneology_tree
        where id = v_tree_id;

        if new.child_id is not null then 
            v_count_all_characters_kids := v_count_all_characters_kids - 1;
        end if;
        if new.father_id is not null then 
            v_count_all_characters_parents := v_count_all_characters_parents - 1;
        end if;
        if new.mother_id is not null then 
            v_count_all_characters_parents := v_count_all_characters_parents - 1;
        end if;

        update geneology_tree
        set count_all_characters_kids = v_count_all_characters_kids,
            count_all_characters_parents = v_count_all_characters_parents,
            updated_at = NOW()
        where id = v_tree_id;

    end if;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
end;
$$;

create or REPLACE TRIGGER count_related_characters_trigger
after insert on relations
for each row
EXECUTE FUNCTION count_related_characters_trigger_func();