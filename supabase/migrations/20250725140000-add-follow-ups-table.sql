-- Migração para implementar sistema de follow-ups com histórico
-- Adicionado em: 2025-07-25

-- 1. Adicionar campo created_by na tabela students para controlar quem criou o registro
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.students ADD COLUMN created_by TEXT;
        RAISE NOTICE 'Coluna created_by adicionada à tabela students';
    ELSE
        RAISE NOTICE 'Coluna created_by já existe na tabela students';
    END IF;
END $$;

-- 2. Criar tabela para follow-ups com histórico cronológico
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

-- 4. Políticas RLS (Row Level Security) para follow_ups
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

-- Política para leitura: qualquer usuário autenticado pode ver follow-ups
CREATE POLICY "Users can view follow_ups" ON public.follow_ups
    FOR SELECT USING (true);

-- Política para inserção: qualquer usuário autenticado pode adicionar follow-ups
CREATE POLICY "Users can insert follow_ups" ON public.follow_ups
    FOR INSERT WITH CHECK (true);

-- Política para atualização: apenas quem criou pode editar (opcional, dependendo da regra de negócio)
CREATE POLICY "Users can update own follow_ups" ON public.follow_ups
    FOR UPDATE USING (created_by = current_setting('app.current_user', true));

-- Política para exclusão: apenas quem criou pode excluir (opcional)
CREATE POLICY "Users can delete own follow_ups" ON public.follow_ups
    FOR DELETE USING (created_by = current_setting('app.current_user', true));

-- 5. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_follow_ups_updated_at 
    BEFORE UPDATE ON public.follow_ups 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. Comentários para documentação
COMMENT ON TABLE public.follow_ups IS 'Tabela para armazenar histórico de follow-ups dos estudantes';
COMMENT ON COLUMN public.follow_ups.content IS 'Conteúdo do follow-up';
COMMENT ON COLUMN public.follow_ups.created_by IS 'Usuário que criou este follow-up';
COMMENT ON COLUMN public.follow_ups.student_id IS 'ID do estudante relacionado ao follow-up'; 