/* Replace with your SQL commands */
CREATE table if not exists geneology_tree (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(300) not null,


    count_all_characters INTEGER DEFAULT 0,
    count_all_characters_alive INTEGER DEFAULT 0,
    count_all_characters_dead INTEGER DEFAULT 0,
    count_all_characters_kids INTEGER DEFAULT 0,
    count_all_characters_parents INTEGER DEFAULT 0,
    count_all_characters_male INTEGER DEFAULT 0,
    count_all_characters_female INTEGER DEFAULT 0,
    -- count_all_characters_grandparents INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Индексы
create index if not exists idx_geneology_tree on geneology_tree (name);
-- Функции
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
before update on geneology_tree
for each row
EXECUTE FUNCTION auto_updated_at_trigger_func();