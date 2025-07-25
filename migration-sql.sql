-- Migração para sistema de Follow-ups
-- Execute este SQL no dashboard do Supabase: https://supabase.com/dashboard/project/olhdcicquehastcwvieu/sql

-- 1. Adicionar campo created_by na tabela students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS created_by TEXT;

-- 2. Criar tabela para follow-ups
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_follow_ups_student_id ON public.follow_ups(student_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_created_at ON public.follow_ups(created_at);

-- 4. Habilitar RLS na tabela follow_ups
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS
CREATE POLICY IF NOT EXISTS "Users can view follow_ups" ON public.follow_ups
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert follow_ups" ON public.follow_ups
    FOR INSERT WITH CHECK (true);

-- 6. Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_follow_ups_updated_at 
    BEFORE UPDATE ON public.follow_ups 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column(); 