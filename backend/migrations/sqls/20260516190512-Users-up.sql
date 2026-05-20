-- Active: 1777829068948@@127.0.0.1@5432@genealogy_tree_db
/* Replace with your SQL commands */

CREATE table if not exists "Roles" (
    id integer primary key,
    role varchar(100) not null unique
)

INSERT INTO "Roles" (id, role) VALUES (1, 'User'), (2, 'Admin');
CREATE table if not exists "Users" (
    id uuid primary key default gen_random_uuid(),
    username varchar(100) not null unique,
    email varchar(100) not null unique,
    password_hash varchar(255) not null,
    role_id integer REFERENCES "Roles"(id) default 1,
    is_blocked boolean default FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

CREATE INDEX idx_users_email ON "Users"(email);
CREATE INDEX idx_users_username ON "Users"(username);
