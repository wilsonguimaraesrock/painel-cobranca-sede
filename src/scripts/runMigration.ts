import { supabase } from "@/integrations/supabase/client";

// Script simplificado para executar migração no Supabase
const runMigration = async () => {
  console.log("🚀 Iniciando execução da migração follow_ups...");
  
  try {
    console.log("1️⃣ Verificando coluna created_by na tabela students...");
    
    // Primeiro vamos verificar se a coluna created_by já existe
    const { data: columnCheck } = await supabase
      .from('students')
      .select('created_by')
      .limit(1);
    
    if (columnCheck) {
      console.log("✅ Coluna created_by já existe na tabela students");
    }
    
    console.log("2️⃣ Verificando se a tabela follow_ups existe...");
    
    // Tentar acessar a tabela follow_ups para ver se já existe
    const { data: tableCheck, error: tableError } = await supabase
      .from('follow_ups' as any)
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.log("⚠️ Tabela follow_ups não existe ainda - precisamos criá-la");
      console.log("🔧 Execute a migração manualmente no dashboard do Supabase:");
      console.log("📂 Arquivo: supabase/migrations/20250725140000-add-follow-ups-table.sql");
      console.log("🌐 Dashboard: https://supabase.com/dashboard/project/olhdcicquehastcwvieu/sql");
      
      // Exibir o conteúdo da migração
      console.log("\n📝 SQL para executar:");
      console.log("═".repeat(60));
      
      const migrationSQL = `
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
      `;
      
      console.log(migrationSQL);
      console.log("═".repeat(60));
      
      return false;
    } else {
      console.log("✅ Tabela follow_ups já existe!");
      return true;
    }
    
  } catch (error) {
    console.error("💥 Erro durante verificação:", error);
    return false;
  }
};

// Executar verificação
runMigration()
  .then((success) => {
    if (success) {
      console.log("🎉 Sistema pronto para usar follow-ups!");
    } else {
      console.log("⚠️ Execute a migração manualmente e execute este script novamente");
    }
  })
  .catch((error) => {
    console.error("💥 Falha na verificação:", error);
  }); 