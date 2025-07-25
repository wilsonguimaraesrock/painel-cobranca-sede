# 🛠️ Documentação Técnica - Sistema de Cobrança

## 🏗️ **Arquitetura do Sistema**

### **Padrão de Arquitetura**: Client-Side SPA
- **Frontend**: React 18 + TypeScript
- **Backend**: Supabase (PostgreSQL + APIs REST)
- **Deploy**: GitHub Pages (Static Hosting)
- **Domain**: Custom Domain com SSL

## 🔐 **Sistema de Autenticação**

### **Implementação** (18/01/2025)
Migração de credenciais hardcoded para autenticação baseada em banco de dados.

```typescript
// ❌ ANTES (Inseguro)
const validCredentials = [
  { username: "admin", password: "123" }
];

// ✅ AGORA (Seguro)
const result = await authenticateUser({ email, password });
if (result.success && isRoleAllowed(result.user.role)) {
  login(result.user);
}
```

### **Fluxo de Autenticação**
1. Usuário insere email/senha
2. `authService.authenticateUser()` consulta `user_profiles`
3. Validação: email + password_hash + is_active + role
4. Se válido: atualiza `last_login` e retorna dados do usuário
5. `AuthContext` armazena estado global

### **Controle de Acesso**
```typescript
const ALLOWED_ROLES = [
  'admin',           // Administrador geral
  'franqueado',      // Gestão da franquia  
  'assessora_adm',   // Suporte administrativo
  'supervisor_adm'   // Supervisão operacional
];
```

## 📱 **Responsividade e SPA Routing**

### **GitHub Pages SPA Fix** (18/01/2025)
Problema: GitHub Pages retorna 404 para rotas que não são arquivos físicos.

**Solução Implementada:**
```html
<!-- public/404.html -->
<script>
  // Redireciona /login para /?/login
  l.replace(l.protocol + '//' + l.hostname + '/?/' + l.pathname.slice(1));
</script>
```

```html
<!-- index.html -->
<script>
  // Converte /?/login de volta para /login
  if (l.search[1] === '/') {
    window.history.replaceState(null, null, decoded_url);
  }
</script>
```

### **Mobile Responsiveness**
```scss
// Dashboard Cards - 18/01/2025
.dashboard-grid {
  // Mobile: 2 colunas (era 1)
  grid-template-columns: repeat(2, 1fr);
  
  // Tablet: 2 colunas  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  // Desktop: 5 colunas
  @media (min-width: 1024px) {
    grid-template-columns: repeat(5, 1fr);
  }
}
```

## 💬 **Sistema de Follow-ups**

### **Arquitetura de Dados**
```sql
-- Tabela principal
CREATE TABLE follow_ups (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_follow_ups_student_id ON follow_ups(student_id);
CREATE INDEX idx_follow_ups_created_at ON follow_ups(created_at);
```

### **Transparência Total**
- **Princípio**: Todos veem todas as conversas
- **Controle**: Apenas criador pode editar/deletar
- **Identificação**: Badges coloridos por autor

```typescript
// Visibilidade: TODOS
const followUps = await getFollowUps(studentId); // Sem filtro por usuário

// Controle de edição: APENAS CRIADOR  
{followUp.createdBy === currentUser && (
  <EditButton />
  <DeleteButton />
)}
```

### **Correção Mobile** (18/01/2025)
**Problema**: Follow-ups não apareciam no mobile
**Causa**: Modal dependia de `student.followUps` (sempre vazio)
**Solução**: Carregamento assíncrono do banco

```typescript
// ❌ ANTES
const [followUps, setFollowUps] = useState(student.followUps || []); // Sempre []

// ✅ AGORA  
useEffect(() => {
  if (isOpen && student.id) {
    const followUpsFromDb = await getFollowUps(student.id);
    setFollowUps(followUpsFromDb); // Dados reais do banco
  }
}, [isOpen, student.id]);
```

## 🔄 **Validação de Movimentação**

### **Problema Corrigido** (18/01/2025)
Alunos com follow-ups não conseguiam ser movidos entre colunas.

**Causa**: Validação usava campo antigo `student.followUp`
```typescript
// ❌ VALIDAÇÃO ANTIGA (Quebrada)
if (student.followUp.trim() === "") {
  // Bloquear movimento - SEMPRE bloqueava!
}
```

**Solução**: Consulta direta ao banco
```typescript
// ✅ VALIDAÇÃO NOVA (Funcional)
const followUps = await getFollowUps(student.id);
if (followUps.length === 0 && !student.followUp?.trim()) {
  // Só bloqueia se realmente não tem follow-ups
}
```

## 🗃️ **Banco de Dados**

### **Supabase Configuration**
```typescript
// src/config/supabase.ts
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: { persistSession: true },
    db: { schema: 'public' },
    global: { headers: { 'x-application-name': 'crm-cobranca' } }
  }
);
```

### **Row Level Security (RLS)**
```sql
-- Política liberal para desenvolvimento
CREATE POLICY "Enable all for authenticated users" 
ON public.follow_ups FOR ALL USING (true);

-- TODO: Implementar políticas mais restritivas por role
```

### **Triggers e Functions**
```sql
-- Auto-update de timestamps
CREATE TRIGGER update_follow_ups_updated_at 
BEFORE UPDATE ON follow_ups 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

## 🚀 **Deploy Pipeline**

### **GitHub Actions Workflow**
```yaml
# .github/workflows/deploy.yml (implícito)
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
steps:
  - npm run build    # Vite build
  - npm run deploy   # gh-pages deployment
```

### **Build Process**
```bash
# Comando de deploy local
npm run predeploy  # → npm run build  
npm run deploy     # → gh-pages -d dist
```

### **Domain Configuration**
- **Custom Domain**: cobranca.rockfellernavegantes.com.br
- **SSL**: Automático via GitHub Pages
- **CNAME**: Configurado no repositório

## 🐛 **Debugging e Logs**

### **Console Logs Implementados**
```typescript
// Autenticação
console.log('🔍 Tentativa de login:', { email, password });
console.log('📋 Usuário encontrado:', userCheck);

// Follow-ups  
console.log(`📋 Carregando follow-ups para aluno ${studentId}`);
console.log(`✅ Aluno ${nome} tem ${count} follow-ups. Pode mover.`);

// Movimentação
console.log(`handleStatusChange chamado para ${studentId} → ${newStatus}`);
```

### **Error Handling**
```typescript
try {
  const result = await operation();
  return result;
} catch (error) {
  console.error("❌ Erro detalhado:", error);
  toast.error("Mensagem user-friendly");
  return fallback; // Sempre tem fallback
}
```

## 📊 **Performance**

### **Bundle Analysis**
```bash
# Warnings atuais do build
- Chunks > 500KB (considerar code splitting)
- Dynamic imports mistos com static imports
```

### **Otimizações Futuras**
- [ ] Lazy loading de componentes
- [ ] Code splitting por rotas  
- [ ] Service Worker para cache
- [ ] Compressão de imagens

## 🔧 **Scripts de Manutenção**

### **SQL Scripts Criados**
```bash
setup-senhas-usuarios.sql      # Configuração inicial de senhas
corrigir-senhas-usuarios.sql   # Correções e validações
cadastrar-nathaly.sql          # Cadastro de nova funcionária
```

### **Comandos Úteis**
```bash
# Verificar estrutura do banco
npm run check-tables

# Backup de dados  
npm run backup-data

# Executar migração
npm run migrate

# Reset de dados (cuidado!)
npm run reset-data
```

---

## 📋 **Próximas Implementações**

### **Alta Prioridade**
- [ ] Políticas RLS mais restritivas
- [ ] Auditoria de ações (quem fez o quê)
- [ ] Backup automático
- [ ] Testes unitários

### **Média Prioridade**  
- [ ] Notificações push
- [ ] Relatórios PDF
- [ ] Integração WhatsApp
- [ ] Dark mode

### **Baixa Prioridade**
- [ ] PWA (Progressive Web App)
- [ ] Offline support
- [ ] Real-time updates
- [ ] Multi-tenancy

---

**Desenvolvedor**: Wade Venga | **Última atualização**: 18/01/2025 