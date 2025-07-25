import { supabase } from "@/integrations/supabase/client";

// Script para verificar e criar tabelas no Supabase
const checkAndCreateTables = async () => {
  console.log("🔍 Verificando estrutura do banco de dados...");
  
  try {
    // 1. Verificar se conseguimos acessar as tabelas existentes
    console.log("1️⃣ Testando acesso às tabelas...");
    
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('count')
      .limit(1);
    
    if (studentsError) {
      console.log("❌ Tabela students não encontrada:", studentsError.message);
      console.log("🔧 Vamos criar as tabelas necessárias...");
      await createMissingTables();
    } else {
      console.log("✅ Tabela students existe e está acessível");
      
      // Verificar se a tabela follow_ups existe
      const { data: followUps, error: followUpsError } = await supabase
        .from('follow_ups' as any)
        .select('count')
        .limit(1);
      
      if (followUpsError) {
        console.log("⚠️ Tabela follow_ups não existe - vamos criar:");
        await createFollowUpsTable();
      } else {
        console.log("✅ Tabela follow_ups já existe!");
      }
    }
    
  } catch (error) {
    console.error("💥 Erro ao verificar tabelas:", error);
  }
};

const createMissingTables = async () => {
  console.log("🏗️ Criando estrutura completa do banco...");
  
  const createTablesSQL = `
-- 1. Criar tabela students (principal)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  curso TEXT,
  valor DECIMAL NOT NULL,
  data_vencimento TEXT,
  dias_atraso INTEGER DEFAULT 0,
  follow_up TEXT,
  email TEXT,
  telefone TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'inadimplente',
  primeiro_contato TEXT,
  ultimo_contato TEXT,
  data_pagamento TEXT,
  mes TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela follow_ups (nova funcionalidade)
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela status_history
CREATE TABLE IF NOT EXISTS public.status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  password_hash TEXT,
  first_login_completed BOOLEAN DEFAULT false,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar tabela available_months
CREATE TABLE IF NOT EXISTS public.available_months (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month_value TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_students_mes ON public.students(mes);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_student_id ON public.follow_ups(student_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_created_at ON public.follow_ups(created_at);
CREATE INDEX IF NOT EXISTS idx_status_history_student_id ON public.status_history(student_id);

-- 7. Habilitar RLS (Row Level Security)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.available_months ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas básicas (permite tudo por enquanto)
CREATE POLICY IF NOT EXISTS "Enable all for authenticated users" ON public.students FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all for authenticated users" ON public.follow_ups FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all for authenticated users" ON public.status_history FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all for authenticated users" ON public.user_profiles FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all for authenticated users" ON public.available_months FOR ALL USING (true);

-- 9. Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_students_updated_at 
    BEFORE UPDATE ON public.students 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_follow_ups_updated_at 
    BEFORE UPDATE ON public.follow_ups 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  `;
  
  console.log("📝 SQL para executar no Supabase:");
  console.log("═".repeat(80));
  console.log(createTablesSQL);
  console.log("═".repeat(80));
  
  console.log("\n🎯 INSTRUÇÕES:");
  console.log("1. Vá para: SQL Editor no seu projeto Supabase");
  console.log("2. Cole o SQL acima");
  console.log("3. Clique em 'RUN'");
  console.log("4. Aguarde a execução");
  console.log("5. Recarregue o Table Editor");
};

const createFollowUpsTable = async () => {
  console.log("🏗️ Criando apenas a tabela follow_ups...");
  
  const followUpsSQL = `
-- Adicionar coluna created_by se não existir
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS created_by TEXT;

-- Criar tabela follow_ups
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_follow_ups_student_id ON public.follow_ups(student_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_created_at ON public.follow_ups(created_at);

-- Habilitar RLS
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY IF NOT EXISTS "Enable all for authenticated users" ON public.follow_ups FOR ALL USING (true);

-- Criar trigger
CREATE TRIGGER IF NOT EXISTS update_follow_ups_updated_at 
    BEFORE UPDATE ON public.follow_ups 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  `;
  
  console.log("📝 SQL para Follow-ups:");
  console.log("═".repeat(60));
  console.log(followUpsSQL);
  console.log("═".repeat(60));
};

// Executar verificação
checkAndCreateTables()
  .then(() => {
    console.log("\n✅ Verificação concluída!");
  })
  .catch((error) => {
    console.error("💥 Erro:", error);
  }); 