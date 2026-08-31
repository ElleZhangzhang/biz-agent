create database if not exists biz_agent 
default character set utf8mb4 
default collate utf8mb4_unicode_ci;

use biz_agent;

create table if not exists products(
    id                  varchar(32)    primary key,
    name                varchar(64)    not null,
    category            varchar(32)    not null,
    price               decimal(10,2)             not null,
    stock               int             not null default 0,
    restockThreshold    int             not null default 0,
);

create table if not exists orders(

);

create table if not exists users(

);

create table if not exists users(

);

create table if not exists approvals(

);