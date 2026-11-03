-- Make an existing account an admin.
-- 1. Supabase dashboard → Authentication → Users → "Invite user" with their email.
-- 2. They accept the invite (this creates their profile automatically).
-- 3. Run this in the SQL editor with their email:
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');

-- Check:
select u.email, p.role from profiles p join auth.users u on u.id = p.id where p.role = 'admin';
