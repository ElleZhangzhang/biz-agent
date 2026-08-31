create database if not exists biz_agent 
default character set utf8mb4 
default collate utf8mb4_unicode_ci;

use biz_agent;

create table if not exists products(
    id                  varchar(32)    primary key,
    name                varchar(64)    not null,
    category            varchar(32)    not null,
    price               decimal(10,2)  not null,
    stock               int            not null default 0,
    restock_threshold    int            not null default 0
);

create table if not exists orders(

);

create table if not exists users(
     id            int auto_increment primary key,   -- 自增主键，新用户自动 +1
    username      varchar(64) not null unique,
    password_hash varchar(128) not null,            -- scrypt 结果 64 字节 hex = 128 字符
    salt          varchar(32)  not null,            -- randomBytes(16) hex = 32 字符
    created_at    datetime     not null
);

create table if not exists tokens(

);

create table if not exists approvals(

);