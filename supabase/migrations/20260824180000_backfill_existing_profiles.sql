-- Backfill profiles for Auth users that existed before the profile trigger migration.
insert into public.profiles (id, username, name)
select
  users.id,
  nullif(users.raw_user_meta_data ->> 'username', ''),
  coalesce(nullif(users.raw_user_meta_data ->> 'name', ''), split_part(coalesce(users.email, 'Benutzer'), '@', 1))
from auth.users as users
left join public.profiles as profiles on profiles.id = users.id
where profiles.id is null;
