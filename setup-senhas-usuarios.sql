-- 🔐 Script para definir senhas temporárias para usuários do sistema de cobrança
-- Execute este SQL no dashboard do Supabase

-- Definir senhas para usuários com roles permitidos
-- Roles permitidos: franqueado, admin, assessora_adm, supervisor_adm

-- 1. Wade Venga (Administrador)
UPDATE public.user_profiles 
SET password_hash = 'Salmos2714'
WHERE email = 'wadevenga@hotmail.com' OR email = 'wadepvenga@gmail.com';

-- 2. Tatiana Venga (Franqueada)
UPDATE public.user_profiles 
SET password_hash = 'tati123'
WHERE email = 'tatiana.direito@hotmail.com';

-- 3. Kamilla Pedrozo (Assessora ADM)
UPDATE public.user_profiles 
SET password_hash = '396502'
WHERE email = 'millaka80@gmail.com';

-- 4. Nathaly Ribeiro Alves (Supervisora ADM)
UPDATE public.user_profiles 
SET password_hash = '156890'
WHERE email = 'nathalyribeiroalves@hotmail.com';

-- 5. Verificar os usuários atualizados
SELECT 
    name,
    email,
    role,
    password_hash,
    is_active,
    CASE 
        WHEN role IN ('franqueado', 'admin', 'assessora_adm', 'supervisor_adm') 
        THEN '✅ ACESSO PERMITIDO'
        ELSE '❌ ACESSO NEGADO'
    END as status_acesso
FROM public.user_profiles
ORDER BY 
    CASE role
        WHEN 'admin' THEN 1
        WHEN 'franqueado' THEN 2  
        WHEN 'supervisor_adm' THEN 3
        WHEN 'assessora_adm' THEN 4
        ELSE 5
    END;

-- 6. Resumo das credenciais para login:

/*
CREDENCIAIS PARA LOGIN NO SISTEMA DE COBRANÇA:

1. ADMINISTRADOR:
   Email: wadevenga@hotmail.com
   Senha: Salmos2714
   
2. FRANQUEADA:
   Email: tatiana.direito@hotmail.com  
   Senha: tati123
   
3. ASSESSORA ADM:
   Email: millaka80@gmail.com
   Senha: 396502
   
4. SUPERVISORA ADM:
   Email: nathalyribeiroalves@hotmail.com
   Senha: 156890

⚠️ IMPORTANTE: 
- Apenas usuários com roles: admin, franqueado, assessora_adm, supervisor_adm podem acessar
- Outros roles (vendedor, coordenador) serão bloqueados
- Recomende trocar senhas após primeiro login
*/ 