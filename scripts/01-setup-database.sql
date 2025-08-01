-- Drop enum jika sudah ada (untuk keperluan migrasi/development)
drop type if exists xtv_cdn_role cascade;
create type xtv_cdn_role as enum ('admin', 'system', 'user', 'guest');

create table if not exists xtv_cdn_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password text not null,
  role xtv_cdn_role not null default 'user',
  created_at timestamp with time zone default now()
);

-- Contoh insert user
insert into xtv_cdn_users (username, password, role) values
  ('admin', 'rahasia123', 'admin'),
  ('system', 'publisher123', 'system'),
  ('budi', 'passwordbudi', 'user'),
  ('siti', 'passwordsiti', 'user'),
  ('guest', 'guest123', 'guest')
on conflict (username) do nothing;
