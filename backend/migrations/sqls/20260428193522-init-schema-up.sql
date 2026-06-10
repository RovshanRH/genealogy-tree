CREATE TYPE gender_status as enum ('male', 'female');

create type marrige_status_type as enum ('divorced', 'single', 'widowed', 'married');

CREATE TABLE IF NOT EXISTS person (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    genealogy_tree_id uuid,
    foreign key (genealogy_tree_id) REFERENCES geneology_tree(id) on delete cascade,
    mother uuid REFERENCES person (id),
    father uuid REFERENCES person (id),
    marrige_status marrige_status_type not null,
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
    isAlive BOOLEAN
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    
);

create Table if not exists relations (
    id uuid PRIMARY KEY (
        father_id,
        mother_id,
        child_id
    ),
    father_id UUID REFERENCES person (id),
    mother_id UUID REFERENCES person (id),
    child_id UUID REFERENCES person (id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    
);

create or replace FUNCTION setAliveStatus()
returns TRIGGER
LANGUAGE plpgsql
as $$
BEGIN

    if new.death_place != null THEN
        new.isAlive = TRUE
    else
        new.isAlive = FALSE
    
    return new;

END;
$$;

create trigger setAliveStatusTrigger
after insert or update on person
for each row
execute function setAliveStatus();


create or replace FUNCTION add_new_relation_trigger_func()
returns TRIGGER
LANGUAGE plpgsql
as $$

BEGIN
    if tg_op = 'INSERT' THEN
        INSERT INTO relations (father_id, mother_id, child_id) VALUES
        (
            new.father_id,
            new.mother_id,
            new.id
        );
    end if;
    if tg_op = 'DELETE' THEN
        DELETE FROM relations where father_id=new.father_id and mother_id=new.mother_id and child_id = new.id;
    end if;
    if tf_op = 'UPDATE' THEN
        UPDATE relations
        SET father_id = new.father_id,
            mother_id = new.mother_id,
            child_id = new.id
        WHERE father_id = old.father_id 
        AND mother_id = old.mother_id 
        AND child_id = old.child_id;
    end if;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
        
END;
$$;

CREATE TRIGGER add_new_relation_trigger
AFTER INSERT OR DELETE OR UPDATE ON person
FOR EACH ROW
EXECUTE FUNCTION add_new_relation_trigger_func();


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
    v_count_all_characters_male INTEGER :=0;
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

        UPDATE geneology_tree
        SET count_all_characters = v_count_all_characters,
            count_all_characters_alive = v_count_all_characters_alive,
            count_all_characters_dead = v_count_all_characters_dead,
            count_all_characters_male = v_count_all_characters_male,
            count_all_characters_female = v_count_all_characters_female,
        where id = v_tree_id;

    end if;

    if tg_op = 'UPDATE' THEN
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

        if new.isAlive is FALSE and old.isAlive is TRUE THEN
            v_count_all_characters_alive := v_count_all_characters_alive - 1;
        end if;

        if new.isAlive is TRUE and old.isAlive is FALSE THEN
            v_count_all_characters_dead := v_count_all_characters_dead - 1;
        end if;

        if OLD.gender = 'male' and new.gender = 'female' THEN
            v_count_all_characters_male := v_count_all_characters_male - 1;
        end if;

        if OLD.gender = 'female' and new.gender = 'male' THEN
            v_count_all_characters_female := v_count_all_characters_female - 1;
        end if;

        UPDATE geneology_tree
        SET count_all_characters = v_count_all_characters,
            count_all_characters_alive = v_count_all_characters_alive,
            count_all_characters_dead = v_count_all_characters_dead,
            count_all_characters_male = v_count_all_characters_male,
            count_all_characters_female = v_count_all_characters_female,
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

        UPDATE geneology_tree
        SET count_all_characters = v_count_all_characters,
            count_all_characters_alive = v_count_all_characters_alive,
            count_all_characters_dead = v_count_all_characters_dead,
            count_all_characters_male = v_count_all_characters_male,
            count_all_characters_female = v_count_all_characters_female,
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

create or REPLACE function auto_updated_at_trigger_func()
returns TRIGGER
LANGUAGE plpgsql
as $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    return NEW;
END;
$$;

create trigger auto_updated_at_trigger
before update on person
for each row
EXECUTE FUNCTION auto_updated_at_trigger_func();

create trigger auto_updated_at_trigger
before update on relations
for each row
EXECUTE FUNCTION auto_updated_at_trigger_func();