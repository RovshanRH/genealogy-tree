-- Active: 1777829068948@@127.0.0.1@5432@genealogy_tree_db
/* Replace with your SQL commands */

create type role as enum ('user', 'admin');

CREATE table if not exists "Users" (
    id uuid primary key default gen_random_uuid (),
    username varchar(100) not null unique,
    email varchar(100) not null unique,
    password_hash varchar(255) not null,
    role_name role not null,
    is_blocked boolean default FALSE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)

CREATE INDEX idx_users_email ON "Users" (email);

CREATE INDEX idx_users_username ON "Users" (username);

-- create or REPLACE function auto_updated_at_trigger_func()
-- returns TRIGGER
-- LANGUAGE plpgsql
-- as $$
-- BEGIN
--     NEW.updated_at = CURRENT_TIMESTAMP;
--     return NEW;
-- END;
-- $$;

-- create trigger auto_updated_at_trigger
-- before update on Users
-- for each row
-- EXECUTE FUNCTION auto_updated_at_trigger_func();