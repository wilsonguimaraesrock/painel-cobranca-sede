-- 🔐 Script CORRIGIDO para definir senhas dos usuários
-- Execute este SQL no dashboard do Supabase (SQL Editor)

-- PRIMEIRO: Verificar usuários existentes e seus roles
SELECT 
    id,
    user_id,
    name,
    email,
    role,
    password_hash,
    is_active,
    CASE 
        WHEN role IN ('franqueado', 'admin', 'assessora_adm', 'supervisor_adm') 
        THEN '✅ DEVE TER ACESSO'
        ELSE '❌ SEM ACESSO'
    END as status_sistema
FROM public.user_profiles
WHERE is_active = true
ORDER BY role;

-- SEGUNDO: Definir senhas para usuários específicos

-- 1. Wade Venga (Administrador) - email correto
UPDATE public.user_profiles 
SET 
    password_hash = 'Salmos2714',
    updated_at = NOW()
WHERE email = 'wadevenga@hotmail.com' AND role = 'admin';

-- 2. Verificar se existe outro email para Wade
UPDATE public.user_profiles 
SET 
    password_hash = 'Salmos2714',
    updated_at = NOW()  
WHERE email = 'wadepvenga@gmail.com' AND role = 'franqueado';

-- 3. Tatiana Venga (Franqueada)
UPDATE public.user_profiles 
SET 
    password_hash = 'tati123',
    updated_at = NOW()
WHERE email = 'tatiana.direito@hotmail.com' AND role = 'franqueado';

-- 4. Kamilla Pedrozo (Assessora ADM)
UPDATE public.user_profiles 
SET 
    password_hash = '396502',
    updated_at = NOW()
WHERE email = 'millaka80@gmail.com' AND role = 'assessora_adm';

-- 5. Nathaly Ribeiro Alves (Supervisora ADM) 
UPDATE public.user_profiles 
SET 
    password_hash = '156890',
    updated_at = NOW()
WHERE email = 'nathalyribeiroalves@hotmail.com' AND role = 'supervisor_adm';

-- TERCEIRO: Verificar as atualizações
SELECT 
    '=== RESULTADO DAS ATUALIZAÇÕES ===' as info;

SELECT 
    name,
    email,
    role,
    password_hash,
    is_active,
    CASE 
        WHEN password_hash IS NOT NULL AND password_hash != '' 
        THEN '✅ SENHA OK'
        ELSE '❌ SEM SENHA'
    END as status_senha,
    CASE 
        WHEN role IN ('franqueado', 'admin', 'assessora_adm', 'supervisor_adm') 
        THEN '✅ ACESSO LIBERADO'
        ELSE '❌ ACESSO NEGADO'
    END as status_acesso
FROM public.user_profiles
WHERE is_active = true
ORDER BY 
    CASE role
        WHEN 'admin' THEN 1
        WHEN 'franqueado' THEN 2  
        WHEN 'supervisor_adm' THEN 3
        WHEN 'assessora_adm' THEN 4
        ELSE 5
    END;

-- QUARTO: Credenciais finais para teste
SELECT 
    '=== CREDENCIAIS PARA LOGIN ===' as info;

SELECT 
    CONCAT('Email: ', email, ' | Senha: ', password_hash, ' | Role: ', role) as credencial
FROM public.user_profiles
WHERE role IN ('franqueado', 'admin', 'assessora_adm', 'supervisor_adm') 
    AND is_active = true 
    AND password_hash IS NOT NULL
ORDER BY role; 