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
     id            int auto_increment primary key, -- 无业务意义
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
    id            varchar(32)   primary key, -- 有业务意义
    customer_name varchar(64)   not null,
    total_amount  decimal(10,2) not null,
    status        varchar(16)   not null,
    risk_level    varchar(16)   not null,
    created_at    datetime      not null
);

create table if not exists order_items (
    id         int auto_increment primary key,
    order_id   varchar(32)  not null,
    product_id varchar(32)  not null,
    name       varchar(64)  not null,
    qty        int          not null,
    price      decimal(10,2) not null,
    foreign key (order_id) references orders(id),
    foreign key (product_id) references products(id)
);

create table if not exists approvals(
    id          varchar(64) primary key,   -- 现有 createApproval 生成的 id，字符串主键
    action      varchar(32) not null,      -- 哪个工具触发的（如 cancel_order）
    description text,                      -- 可空：有些审批没描述
    requester   varchar(64),               -- 可空
    params      json        not null,      -- MySQL 8 原生 JSON，不用 TEXT + 手动 parse
    status      varchar(16) not null,      -- pending/approved/rejected/expired
    decided_by  varchar(64),               -- 可空：还没人决定时为空
    created_at  datetime    not null,
    resolved_at datetime    null           -- 可空：未决定时 NULL，决定后填时间
);