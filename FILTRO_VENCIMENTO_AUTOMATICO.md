# Filtro Automático por Data de Vencimento

## 📋 **Descrição da Funcionalidade**

Implementação de um sistema que automaticamente exibe alunos nos meses corretos baseado em sua data de vencimento, mesmo que tenham sido inseridos posteriormente.

## 🎯 **Objetivo**

Resolver o problema onde alunos com vencimento em um mês específico (ex: 30/31 de julho) não apareciam no mês correto quando inseridos após a virada do mês (ex: em agosto).

## 🔧 **Como Funciona**

### **Lógica de Aparição por Mês:**

1. **Mês de Criação**: Aluno sempre aparece no mês onde foi criado
2. **Mês de Vencimento**: Aluno aparece no mês da sua data de vencimento
3. **Mês Atual**: Se inadimplente, aparece no mês atual para acompanhamento

### **Exemplo Prático:**

- **Aluno João**: Vencimento 30/07/2025, inserido em 05/08/2025
- **Resultado**: Aparece em **Julho/25** (mês de vencimento) e **Agosto/25** (mês atual, se inadimplente)

## 📁 **Arquivos Modificados**

### **Novo Arquivo:**
- `src/services/vencimentoService.ts` - Serviço principal com lógica de filtro

### **Arquivos Modificados:**
- `src/services/supabaseService.ts` - Nova função `getStudentsWithVencimentoFilter`
- `src/components/DataLoader.tsx` - Usa nova função para carregar dados

## 🔍 **Funções Principais**

### **`getMesVencimento(dataVencimento: string): string`**
- Extrai o mês (MM-YYYY) da data de vencimento
- Suporta formatos DD/MM/YYYY e DD/MM

### **`shouldStudentAppearInMonth(student: Student, targetMonth: string): boolean`**
- Determina se um aluno deve aparecer no mês especificado
- Considera mês de criação, vencimento e status atual

### **`filterStudentsForMonth(allStudents: Student[], targetMonth: string): Student[]`**
- Filtra lista completa de alunos para o mês alvo
- Aplica todas as regras de vencimento

### **`getStudentsWithVencimentoFilter(targetMonth: string): Promise<Student[]>`**
- Busca todos os alunos do banco
- Aplica filtro de vencimento automaticamente
- Carrega histórico e follow-ups

## 🧪 **Como Testar**

### **Cenário 1: Aluno com Vencimento em Mês Anterior**
1. Criar aluno com vencimento 30/07/2025 em agosto
2. Verificar se aparece em julho/25
3. Verificar se aparece em agosto/25 (se inadimplente)

### **Cenário 2: Aluno com Vencimento no Mês Atual**
1. Criar aluno com vencimento 15/08/2025 em agosto
2. Verificar se aparece apenas em agosto/25

### **Cenário 3: Aluno Pago**
1. Aluno com status "pagamento-feito"
2. Verificar se não aparece em meses futuros

## 📊 **Benefícios**

- ✅ **Visibilidade Completa**: Alunos aparecem nos meses corretos automaticamente
- ✅ **Continuidade**: Inadimplentes aparecem no mês atual para acompanhamento
- ✅ **Flexibilidade**: Suporta inserção tardia de dados
- ✅ **Performance**: Filtro aplicado no servidor, não no cliente

## 🔄 **Fluxo de Dados**

```
1. Usuário seleciona mês (ex: Agosto/25)
2. DataLoader chama getStudentsWithVencimentoFilter
3. Sistema busca TODOS os alunos do banco
4. Aplica filtro de vencimento para agosto/25
5. Retorna alunos que devem aparecer em agosto/25
6. Interface exibe alunos filtrados
```

## ⚠️ **Considerações**

- **Performance**: Busca todos os alunos, mas filtro é eficiente
- **Cache**: Dados são recarregados a cada mudança de mês
- **Compatibilidade**: Mantém compatibilidade com dados existentes
- **Status**: Alunos inadimplentes aparecem no mês atual automaticamente

## 🚀 **Próximos Passos**

- [ ] Otimizar performance com cache
- [ ] Adicionar indicador visual de alunos "importados" por vencimento
- [ ] Implementar filtros adicionais por período
- [ ] Adicionar relatórios de vencimento por mês 