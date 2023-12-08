create schema remorahchat;

create table remorahchat.admonition (
    id serial primary key,
    user_id varchar(20) not null,
    user_name varchar(64) not null,
    idiom_id smallint not null,
    admonished_at timestamp not null default current_timestamp
);