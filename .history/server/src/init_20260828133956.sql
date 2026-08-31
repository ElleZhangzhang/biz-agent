create database if not exists biz-agent 
default character set utf8mb4 
default collate utf8mb4_unicode_ci;

use biz-agent;

create table if not exists products(
    id  varchar(255)
    name varchar(255)
    category varchar(255)
    price: int,
    stock: int,
    restockThreshold: int
);

create table if not exists orders(

);

create table if not exists users(

);

create table if not exists users(

);

create table if not exists approvals(

);