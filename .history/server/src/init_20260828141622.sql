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

create table if not exists users(
     id            int auto_increment primary key,   -- 自增主键，新用户自动 +1
    username      varchar(64) not null unique,
    password_hash varchar(128) not null,            -- scrypt 结果 64 字节 hex = 128 字符
    salt          varchar(32)  not null,            -- randomBytes(16) hex = 32 字符
    created_at    datetime     not null
);

create table if not exists tokens(
    token      varchar(64) primary key,
    username   varchar(64) not null,
    expires_at datetime    not null,
    foreign key (username) references users(username)   -- 外键：指向父表 users 的 username
    -- TODO 注销用户
    -- FIXME 外键会阻拦注销用户的行为
);

create table if not exists orders(
     id            varchar(32)   primary key,
    customer_name varchar(64)   not null,
    total_amount  decimal(10,2) not null,
    status        varchar(16)   not null,
    risk_level    varchar(16)   not null,
    created_at    datetime      not null
);

create table if not exists approvals(
    create table if not exists order_items (
    id         int auto_increment primary key,
    order_id   varchar(32)  not null,
    product_id varchar(32)  not null,
    name       varchar(64)  not null,
    qty        int          not null,
    price      decimal(10,2) not null,
    foreign key (order_id) references orders(id)
);
);