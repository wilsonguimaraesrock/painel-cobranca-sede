-- 🆕 SQL para cadastrar nova funcionária: Nathaly Ribeiro Alves
-- Execute este SQL diretamente no dashboard do Supabase

-- 1. Inserir na tabela funcionarios
INSERT INTO public.funcionarios (
    nome,
    email,
    cargo,
    departamento,
    ativo,
    datacadastro
) VALUES (
    'Nathaly Ribeiro Alves',
    'nathalyribeiroalves@hotmail.com',
    'Analista de Cobrança',
    'Cobrança',
    true,
    NOW()::TEXT
);

-- 2. Inserir na tabela user_profiles para autenticação
INSERT INTO public.user_profiles (
    user_id,
    name,
    email,
    role,
    password_hash,
    is_active,
    first_login_completed,
    created_at
) VALUES (
    'nathaly.alves',
    'Nathaly Ribeiro Alves',
    'nathalyribeiroalves@hotmail.com',
    'funcionario',
    '156890',
    true,
    true,
    NOW()
);

-- 3. Verificar se os cadastros foram realizados com sucesso

-- Verificar funcionários
SELECT id, nome, email, cargo, departamento, ativo, datacadastro 
FROM public.funcionarios 
WHERE email = 'nathalyribeiroalves@hotmail.com';

-- Verificar user_profiles
SELECT id, user_id, name, email, role, password_hash, is_active, created_at 
FROM public.user_profiles 
WHERE email = 'nathalyribeiroalves@hotmail.com';

-- DADOS PARA LOGIN APÓS EXECUTAR:
-- Email/Usuario: nathaly.alves
-- Senha: 156890
-- 
-- ✅ PRONTO PARA USO! 