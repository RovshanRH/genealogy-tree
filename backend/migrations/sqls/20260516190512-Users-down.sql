-- Active: 1777829068948@@127.0.0.1@5432@genealogy_tree_db
/* Replace with your SQL commands */

drop table if exists Users;
drop table if exists Roles;

drop index if exists idx_users_email;
drop table if EXISTS idx_users_username;