/* Replace with your SQL commands */
CREATE table if not exists genealogy_tree (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name varchar(300) not null,
    count_all_characters INTEGER DEFAULT 0,
    count_all_characters_alive INTEGER DEFAULT 0,
    count_all_characters_dead INTEGER DEFAULT 0,
    count_all_characters_kids INTEGER DEFAULT 0,
    count_all_characters_parents INTEGER DEFAULT 0,
    count_all_characters_male INTEGER DEFAULT 0,
    count_all_characters_female INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Устанавливаем текущую временную метку в поле updated_at
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_updated_at
    BEFORE UPDATE ON genealogy_tree
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

