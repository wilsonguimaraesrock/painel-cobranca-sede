# 📝 Changelog - Sistema de Cobrança

Todas as mudanças notáveis do projeto serão documentadas neste arquivo.

## [2.0.1] - 2025-01-18

### 🔄 Alterado
- Follow-ups: numeração cronológica (mais antigo = #1) e exibição com mais recentes no topo
  - Numeração baseada na ordem ascendente de criação
  - Renderização invertida (recente → antigo) no card do aluno
  - Mantém badges de autor e timestamps

---

## [2.0.0] - 2025-01-18 🚀 **RELEASE MAJOR**

### 🆕 **Adicionado**
- **Sistema de autenticação baseado em banco de dados**
  - Novo serviço `authService.ts` com validação por roles
  - Interface de login renovada com design moderno
  - Controle de acesso granular por perfil de usuário

- **Arquivos SQL de configuração**
  - `setup-senhas-usuarios.sql` - Senhas temporárias para usuários
  - `corrigir-senhas-usuarios.sql` - Script de correção com validações
  - `cadastrar-nathaly.sql` - Cadastro de nova funcionária

- **SPA Routing para GitHub Pages**
  - `public/404.html` - Redirecionamento automático para SPAs
  - Script de decodificação de URLs no `index.html`

### 🔄 **Alterado**
- **Dashboard responsivo**
  - Cards de indicadores: 1 → 2 colunas no mobile
  - Tipografia ajustada para telas pequenas
  - Ícones e espaçamentos otimizados

- **Sistema de follow-ups aprimorado**
  - Badges coloridos para identificar autores
  - Indicação clara: "Visível para toda a equipe"
  - Carregamento direto do banco no modal (mobile fix)

- **Validação de movimentação de alunos**
  - Verificação via banco de dados (`getFollowUps`)
  - Substituição do campo antigo `followUp` pelo novo sistema
  - Logs de debug para troubleshooting

### 🐛 **Corrigido**
- **Erro 404 em SPAs**: URLs diretas e reload de páginas
- **Follow-ups não apareciam no mobile**: Carregamento assíncrono
- **Bloqueio de movimentação**: Validação usando sistema antigo
- **Autenticação inconsistente**: Migração para banco de dados

### 🔐 **Segurança**
- **Controle de acesso por roles**:
  - `admin` - Acesso total
  - `franqueado` - Gestão operacional
  - `assessora_adm` - Suporte administrativo
  - `supervisor_adm` - Supervisão e controle

### 👥 **Usuários**
- **Nova funcionária cadastrada**: Nathaly Ribeiro Alves
  - Email: nathalyribeiroalves@hotmail.com
  - Role: supervisor_adm
  - Acesso: Liberado

---

## [1.5.0] - 2025-01-17

### 🆕 **Adicionado**
- Sistema de follow-ups com histórico cronológico
- Tabela `follow_ups` no banco de dados
- Interface de gerenciamento de follow-ups
- Transparência total entre equipe

### 🔄 **Alterado**
- Estrutura de dados dos alunos
- Interface dos cards de estudantes
- Modal de detalhes expandido

---

## [1.4.0] - 2025-01-16

### 🆕 **Adicionado**
- Dashboard com métricas de cobrança
- Filtros por categoria de atraso
- Kanban board com 4 colunas
- Sistema de arrastar e soltar

---

## [1.3.0] - 2025-01-15

### 🆕 **Adicionado**
- Integração com Supabase
- Sistema de autenticação básico
- CRUD de estudantes
- Histórico de mudanças de status

---

## [1.2.0] - 2025-01-14

### 🆕 **Adicionado**
- Interface inicial com React + TypeScript
- Componentes shadcn/ui
- Tailwind CSS para styling
- Estrutura básica do projeto

---

## [1.1.0] - 2025-01-13

### 🆕 **Adicionado**
- Configuração inicial do projeto
- Vite como bundler
- ESLint e configurações de desenvolvimento

---

## [1.0.0] - 2025-01-12

### 🆕 **Inicial**
- Criação do repositório
- Configuração básica do ambiente
- Estrutura inicial do projeto

---

## 📋 **Template de Versão**

```markdown
## [X.Y.Z] - YYYY-MM-DD

### 🆕 **Adicionado**
- Novas funcionalidades

### 🔄 **Alterado**
- Funcionalidades modificadas

### 🐛 **Corrigido**
- Bugs resolvidos

### 🗑️ **Removido**
- Funcionalidades removidas

### 🔐 **Segurança**
- Melhorias de segurança
```

---

**Legenda**:
- 🆕 Adicionado
- 🔄 Alterado  
- 🐛 Corrigido
- 🗑️ Removido
- 🔐 Segurança
- 👥 Usuários
- ⚡ Performance
- 📱 Mobile
- 🌐 Deploy 