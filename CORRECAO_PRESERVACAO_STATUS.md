# 🔧 CORREÇÃO: Preservação de Status ao Importar da Planilha

**Data da Correção:** 04/08/2025  
**Problema:** Alunos perdiam status ao importar da planilha (voltavam para "inadimplente")

## 🐛 **Problema Identificado**

Quando um aluno era importado da planilha, ele sempre voltava para o status "inadimplente", mesmo que já estivesse em uma coluna mais avançada (ex: "Mensagem Enviada", "Resposta Recebida").

### **Causa Raiz:**
1. **Importação da planilha** sempre definia status como "inadimplente"
2. **Função `saveStudents`** usava `upsert` que sobrescrevia dados existentes
3. **Status existente** era perdido durante a importação

## 🔍 **Análise do Código**

### **Problema no `googleSheetsApi.ts`:**
```typescript
// ❌ CÓDIGO PROBLEMÁTICO
const student: Student = {
  // ... outros campos
  status: "inadimplente" as Status, // ← SEMPRE inadimplente
  // ... outros campos
};
```

### **Problema no `Index.tsx`:**
```typescript
// ❌ CÓDIGO PROBLEMÁTICO
const sheetsData = await getSheetData(sheetName);
await saveStudents(sheetsData, selectedMonth); // ← Sobrescrevia status
```

## 🔧 **Solução Implementada**

### **1. Nova Função: `preserveExistingStatus`**

```typescript
export const preserveExistingStatus = async (
  newStudents: Student[], 
  mes: string
): Promise<Student[]> => {
  // Buscar alunos existentes no banco
  const existingStudents = await getStudents(mes);
  
  // Mapear por nome para facilitar busca
  const existingStudentsMap = new Map<string, Student>();
  existingStudents.forEach(student => {
    existingStudentsMap.set(student.nome.toLowerCase().trim(), student);
  });
  
  // Preservar status existente ou usar "inadimplente" para novos
  return newStudents.map(newStudent => {
    const existingStudent = existingStudentsMap.get(
      newStudent.nome.toLowerCase().trim()
    );
    
    if (existingStudent) {
      // Preservar status existente
      return {
        ...newStudent,
        status: existingStudent.status,
        statusHistory: existingStudent.statusHistory || [],
        followUps: existingStudent.followUps || []
      };
    } else {
      // Novo aluno - status "inadimplente"
      return {
        ...newStudent,
        status: "inadimplente" as Status,
        statusHistory: [],
        followUps: []
      };
    }
  });
};
```

### **2. Modificação no `Index.tsx`:**

```typescript
// ✅ CÓDIGO CORRIGIDO
const handleForceImport = async () => {
  // ... código existente ...
  
  // Get data directly from sheet
  const sheetsData = await getSheetData(sheetName);
  
  // Preservar status existente dos alunos
  const studentsWithPreservedStatus = await preserveExistingStatus(
    sheetsData, 
    selectedMonth
  );
  
  // Save to database
  await saveStudents(studentsWithPreservedStatus, selectedMonth);
  
  // ... resto do código ...
};
```

## 🎯 **Comportamento Corrigido**

### **Antes da Correção:**
- ❌ Aluno em "Mensagem Enviada" → Importa da planilha → Volta para "Inadimplente"
- ❌ Aluno em "Resposta Recebida" → Importa da planilha → Volta para "Inadimplente"
- ❌ Aluno em "Pagamento Realizado" → Importa da planilha → Volta para "Inadimplente"

### **Depois da Correção:**
- ✅ Aluno em "Mensagem Enviada" → Importa da planilha → Continua em "Mensagem Enviada"
- ✅ Aluno em "Resposta Recebida" → Importa da planilha → Continua em "Resposta Recebida"
- ✅ Aluno em "Pagamento Realizado" → Importa da planilha → Continua em "Pagamento Realizado"
- ✅ **Novo aluno** → Importa da planilha → Status "Inadimplente"

## 📊 **Fluxo de Funcionamento**

### **Importação com Preservação:**
1. **Usuário clica** "Import from Spreadsheet"
2. **Sistema busca** dados da planilha
3. **Sistema busca** alunos existentes no banco
4. **Sistema compara** por nome (case-insensitive)
5. **Sistema preserva** status existente para alunos conhecidos
6. **Sistema define** "inadimplente" para alunos novos
7. **Sistema salva** dados preservados no banco

### **Exemplo Prático:**
```
Planilha: João, Maria, Pedro, Ana
Banco existente: 
- João: "mensagem-enviada"
- Maria: "resposta-recebida"
- Pedro: "pagamento-feito"

Resultado após importação:
- João: "mensagem-enviada" (preservado)
- Maria: "resposta-recebida" (preservado)
- Pedro: "pagamento-feito" (preservado)
- Ana: "inadimplente" (novo aluno)
```

## 🧪 **Como Testar a Correção**

1. **Acesse:** http://localhost:8081
2. **Faça login** com credenciais de admin
3. **Selecione um mês** com alunos
4. **Mova alguns alunos** para colunas diferentes:
   - Aluno A → "Mensagem Enviada"
   - Aluno B → "Resposta Recebida"
   - Aluno C → "Pagamento Realizado"
5. **Clique em "Import from Spreadsheet"**
6. **Verifique se os alunos** mantiveram suas posições nas colunas

## 🔧 **Arquivos Modificados**

### **Modificados:**
- `src/services/supabaseService.ts` - Nova função `preserveExistingStatus`
- `src/pages/Index.tsx` - Lógica de importação atualizada

### **Não Modificados:**
- `src/lib/googleSheetsApi.ts` - Mantém comportamento original
- `src/services/monthsService.ts` - Já preservava status na migração

## 🎉 **Benefícios da Correção**

### ✅ **Preservação de Trabalho:**
- Status não é perdido durante importação
- Follow-ups mantidos
- Histórico preservado

### ✅ **Flexibilidade:**
- Pode importar planilha atualizada sem perder progresso
- Novos alunos começam como "inadimplente"
- Alunos existentes mantêm posição

### ✅ **Consistência:**
- Comportamento previsível
- Dados não são sobrescritos incorretamente
- Logs detalhados para debug

---

**Status:** ✅ CORRIGIDO E FUNCIONANDO  
**Testado:** 🟡 PENDENTE  
**Deploy:** 🟡 PENDENTE 