
DROP TABLE if exists relations;
DROP Table if exists person cascade;
DROP INDEX if exists idx_person_surname;

-- TRUNCATE person RESTART IDENTITY;
select * from person;
