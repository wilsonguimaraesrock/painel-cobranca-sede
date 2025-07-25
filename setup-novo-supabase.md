# 🚀 Configurar Novo Projeto Supabase

## 1. Criar Projeto

1. Acesse: https://supabase.com/dashboard
2. Clique em "New Project"
3. Escolha um nome: `kanban-cobranca-rockfeller`
4. Senha do banco: (crie uma senha forte)
5. Região: `South America (São Paulo)`

## 2. Configurar Variáveis

Após criar o projeto, pegue:
- **Project URL**: https://[SEU-PROJECT-ID].supabase.co
- **Anon Key**: eyJ... (chave pública)

## 3. Atualizar Código

Editar: `src/integrations/supabase/client.ts`
```typescript
const SUPABASE_URL = "SUA_NOVA_URL";
const SUPABASE_PUBLISHABLE_KEY = "SUA_NOVA_CHAVE";
```

## 4. Executar Migrações

No SQL Editor do novo projeto, executar:

### 4.1 Criar tabela students
```sql
CREATE TABLE public.students (
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
```

### 4.2 Criar tabela follow_ups
```sql
CREATE TABLE public.follow_ups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.3 Configurar RLS e políticas
```sql
-- Habilitar RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permite tudo - ajustar depois)
CREATE POLICY "Enable all for authenticated users" ON public.students
    FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON public.follow_ups
    FOR ALL USING (true);
```

## 5. Regenerar Tipos

```bash
npx supabase gen types typescript --project-id SEU-PROJECT-ID > src/integrations/supabase/types.ts
```

---

**Quer criar um novo projeto ou continuar procurando o atual?** 