/* Replace with your SQL commands */
CREATE table if not exists geneology_tree (
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

insert into geneology_tree (name) values ('name');
select id from geneology_tree;