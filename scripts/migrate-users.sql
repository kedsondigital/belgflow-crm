-- Script para migrar senhas do Supabase Auth para a tabela profiles
-- O Supabase Auth armazena senhas na tabela auth.users com bcrypt
-- Como já é bcrypt, podemos copiar direto!

-- Verificar usuários existentes no auth.users e no profiles
SELECT
  p.id,
  p.email,
  p.name,
  au.encrypted_password IS NOT NULL as has_password_in_auth
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id;

-- Copiar as senhas bcrypt do auth.users para profiles.password
UPDATE profiles p
SET password = au.encrypted_password
FROM auth.users au
WHERE p.id = au.id
AND au.encrypted_password IS NOT NULL
AND p.password IS NULL;

-- Verificar resultado
SELECT id, email, name, password IS NOT NULL as has_password
FROM profiles;
