-- SQL Corrigido para Follow-ups (sem IF NOT EXISTS para políticas)

-- 1. Adicionar coluna created_by se não existir
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS created_by TEXT;

-- 2. Criar tabela follow_ups
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_follow_ups_student_id ON public.follow_ups(student_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_created_at ON public.follow_ups(created_at);

-- 4. Habilitar RLS
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

-- 5. Criar função para updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Criar trigger
DROP TRIGGER IF EXISTS update_follow_ups_updated_at ON public.follow_ups;
CREATE TRIGGER update_follow_ups_updated_at 
    BEFORE UPDATE ON public.follow_ups 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 7. Remover política existente se houver e criar nova
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.follow_ups;
CREATE POLICY "Enable all for authenticated users" ON public.follow_ups FOR ALL USING (true); 