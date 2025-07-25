-- SQL para redefinir senha do usuário wadevenga@hotmail.com
-- Execute este SQL diretamente no dashboard do Supabase

-- 1. Verificar usuário atual
SELECT id, email, name, role, password_hash 
FROM public.user_profiles 
WHERE email = 'wadevenga@hotmail.com';

-- 2. Redefinir senha (usando senha simples temporária)
UPDATE public.user_profiles 
SET password_hash = '123456',
    last_login = NOW()
WHERE email = 'wadevenga@hotmail.com';

-- 3. Verificar se a atualização funcionou
SELECT id, email, name, role, password_hash, last_login 
FROM public.user_profiles 
WHERE email = 'wadevenga@hotmail.com';

-- DADOS PARA LOGIN APÓS EXECUTAR:
-- Email: wadevenga@hotmail.com
-- Senha: 123456
-- 
-- ⚠️ IMPORTANTE: Mude esta senha após o primeiro login! 