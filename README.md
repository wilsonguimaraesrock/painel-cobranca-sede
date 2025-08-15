# 💼 Sistema de Cobrança - Rockfeller Navegantes

Sistema de gerenciamento de cobrança para instituição de ensino, com interface Kanban para acompanhamento de alunos inadimplentes.

## 🌐 **Deploy Ativo**
- **Produção**: https://cobranca.rockfellernavegantes.com.br
- **Tipo**: GitHub Pages (SPA)
- **Deploy**: Automático via GitHub Actions

## 🚀 **Funcionalidades Principais**

### 📊 **Dashboard de Cobrança**
- Métricas em tempo real de inadimplência
- Cards indicadores responsivos (2 colunas no mobile)
- Filtros por categoria de atraso
- Valores monetários por categoria

### 🗂️ **Kanban Board**
- **4 Colunas**: Inadimplente → Mensagem Enviada → Resposta Recebida → Pagamento Realizado
- Arrastar e soltar entre colunas
- Validação automática de follow-ups
- Histórico de mudanças de status

### 👥 **Sistema de Follow-ups**
- **Transparência total**: Visível para toda a equipe
- Histórico cronológico por aluno
- Identificação clara de autores
- Edição restrita ao criador
- ✅ Numeração cronológica: o primeiro follow-up é o **#1** (mais antigo) e incrementa com o tempo
- ✅ Exibição no card: **mais recentes no topo**, rolando para os mais antigos

### 🔐 **Autenticação Robusta**
- Baseada em banco de dados (Supabase)
- Controle de acesso por roles
- Roles permitidos: `admin`, `franqueado`, `assessora_adm`, `supervisor_adm`

## 📋 **Implementações de Hoje (2025-01-18)**

### ✅ **1. Correção SPA Routing (GitHub Pages)**
- **Problema**: Erro 404 ao atualizar página ou acessar URL direta
- **Solução**: Implementado `404.html` com redirecionamento automático
- **Arquivos**: `public/404.html`, `index.html` (script de redirecionamento)

### ✅ **2. Nova Funcionária Cadastrada**
- **Nome**: Nathaly Ribeiro Alves
- **Email**: nathalyribeiroalves@hotmail.com
- **Role**: Funcionário/Supervisora ADM
- **Arquivo**: `cadastrar-nathaly.sql`

### ✅ **3. Sistema de Autenticação Renovado**
- **Antes**: Credenciais hardcoded no código
- **Agora**: Banco de dados com controle de roles
- **Arquivos**: 
  - `src/services/authService.ts` (novo)
  - `src/contexts/AuthContext.tsx` (atualizado)
  - `src/pages/LoginPage.tsx` (interface renovada)
  - `setup-senhas-usuarios.sql` (senhas temporárias)

### ✅ **4. Follow-ups Aprimorados**
- **Visibilidade**: Confirmado que todos veem todas as conversas
- **Interface**: Badges coloridos para identificar autores
- **Mobile Fix**: Carregamento direto do banco ao abrir modal
- **Numeração e exibição**: Numeração do mais antigo para o mais recente (#1, #2, ...), com exibição no topo dos mais recentes

### ✅ **5. Dashboard Responsivo**
- **Mobile**: Alterado de 1 para 2 colunas
- **Tipografia**: Ajustada para telas pequenas
- **Layout**: `grid-cols-2 md:grid-cols-2 lg:grid-cols-5`

### ✅ **6. Validação Follow-ups Corrigida**
- **Problema**: Validação usando campo antigo `followUp`
- **Solução**: Verificação no banco de dados (`getFollowUps`)
- **Resultado**: Alunos com follow-ups podem ser movidos

## 🛠️ **Stack Tecnológica**

### **Frontend**
- **React 18** + TypeScript
- **Vite** (bundler)
- **Tailwind CSS** (styling)
- **shadcn/ui** (componentes)
- **React Router** (SPA routing)
- **Tanstack Query** (data fetching)

### **Backend/Database**
- **Supabase** (PostgreSQL + Auth + Real-time)
- **Row Level Security** (RLS)
- **Triggers** e **Functions**

### **Deploy & CI/CD**
- **GitHub Pages** (hosting)
- **GitHub Actions** (CI/CD)
- **Custom Domain** com SSL

## 📁 **Estrutura do Projeto**

```
src/
├── components/           # Componentes React
│   ├── ui/              # Componentes shadcn/ui
│   ├── Dashboard.tsx    # Dashboard com métricas
│   ├── KanbanBoard.tsx  # Board principal
│   ├── FollowUpManager.tsx # Sistema de follow-ups
│   └── StudentCard.tsx  # Cards dos alunos
├── pages/               # Páginas principais
│   ├── Index.tsx        # Página principal
│   ├── LoginPage.tsx    # Página de login
│   └── RegisterStudentPage.tsx
├── services/            # Lógica de negócio
│   ├── authService.ts   # Autenticação
│   ├── supabaseService.ts # CRUD operations
│   └── monthsService.ts # Gerenciamento de meses
├── contexts/            # Context API
│   └── AuthContext.tsx  # Estado de autenticação
└── types/               # TypeScript definitions
    └── index.ts
```

## 🗃️ **Banco de Dados**

### **Tabelas Principais**
```sql
-- Alunos e dados de cobrança
public.students (
  id, nome, valor, data_vencimento, 
  dias_atraso, status, mes, ...
)

-- Sistema de follow-ups
public.follow_ups (
  id, student_id, content, created_by,
  created_at, updated_at
)

-- Controle de usuários
public.user_profiles (
  id, user_id, name, email, role,
  password_hash, is_active, ...
)

-- Histórico de mudanças
public.status_history (
  id, student_id, old_status, new_status,
  changed_by, changed_at
)
```

## 🔑 **Credenciais de Acesso**

### **Usuários Ativos**
```
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
```

## 🚀 **Como Rodar Localmente**

```bash
# 1. Clonar repositório
git clone https://github.com/takkyonAI/a-kanban-brasil.git
cd a-kanban-brasil

# 2. Instalar dependências
npm install

# 3. Configurar ambiente
# Criar .env.local com variáveis do Supabase

# 4. Rodar desenvolvimento
npm run dev

# 5. Build para produção
npm run build

# 6. Deploy para GitHub Pages
npm run deploy
```

## 📋 **Scripts Disponíveis**

```json
{
  "dev": "vite",                    // Servidor de desenvolvimento
  "build": "vite build",            // Build para produção
  "preview": "vite preview",        // Preview do build
  "deploy": "gh-pages -d dist",     // Deploy para GitHub Pages
  "predeploy": "npm run build"      // Pre-deploy build
}
```

## 🐛 **Debugging**

### **Console Logs Implementados**
- `📋 Carregando follow-ups para aluno [ID]`
- `✅ Aluno [Nome] tem X follow-ups registrados. Pode mover.`
- `🔍 Tentativa de login: {email, password}`

### **Problemas Conhecidos e Soluções**

1. **404 ao atualizar página**: ✅ Resolvido com SPA routing
2. **Follow-ups não aparecem no mobile**: ✅ Resolvido com carregamento do banco
3. **Não consegue mover aluno**: ✅ Resolvido com nova validação

## 📝 **Próximas Melhorias**

- [ ] Implementar notificações em tempo real
- [ ] Relatórios avançados de cobrança
- [ ] Integração com WhatsApp
- [ ] Backup automático dos dados
- [ ] Auditoria completa de ações

## 📞 **Suporte**

- **Desenvolvedor**: Wade Venga
- **Email**: wadevenga@hotmail.com
- **GitHub**: https://github.com/takkyonAI/a-kanban-brasil

---

**Última atualização**: 18/01/2025
**Versão**: 2.0.1 (Numeração e exibição de follow-ups)
