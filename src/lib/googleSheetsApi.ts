
import { Student, SheetData, Status } from "@/types";
import { toast } from "sonner";

// API Key and Spreadsheet ID
const API_KEY = "AIzaSyDXMSnzWko3pVk4VTV2OYKY2HYN89dM130";
const SPREADSHEET_ID = "1j2IWk96CNl-y7fLLC5CE4m2pd1tdKsubnLrG1fF7DZw";

// Obtém as abas (meses) disponíveis na planilha
export async function getAvailableSheets(): Promise<string[]> {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error("Falha ao carregar as abas da planilha");
    }
    
    const data = await response.json();
    return data.sheets.map((sheet: any) => sheet.properties.title);
  } catch (error) {
    console.error("Erro ao obter abas da planilha:", error);
    toast.error("Erro ao obter abas da planilha");
    return [];
  }
}

// Obtém dados da planilha para o mês selecionado
export async function getSheetData(sheetName: string): Promise<Student[]> {
  try {
    // Buscamos um intervalo maior para examinar a estrutura completa
    const range = `${sheetName}!A1:J50`;
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error("Falha ao carregar dados da planilha");
    }
    
    const data: SheetData = await response.json();
    
    if (!data.values || data.values.length === 0) {
      return [];
    }

    // Converter dados da planilha para objetos Student
    const students: Student[] = [];
    
    // Encontrar a seção de alunos - geralmente após "RETIRADOS DA PLANILHA" ou onde tiver um cabeçalho claro
    let startIndex = -1;
    for (let i = 0; i < data.values.length; i++) {
      const row = data.values[i];
      if (row && row[0] === "RETIRADOS DA PLANILHA") {
        // A próxima linha deve conter os cabeçalhos e depois começam os alunos
        startIndex = i + 2; // Pulamos o "RETIRADOS DA PLANILHA" e a linha de cabeçalho
        break;
      }
      
      // Alternativa: buscar linha com "NOME" na primeira coluna, que indica cabeçalho
      if (row && row[0] === "NOME") {
        startIndex = i + 1; // A próxima linha após "NOME" contém alunos
        break;
      }
    }
    
    // Se não encontrarmos o marcador, tentamos buscar alunos pela estrutura de dados
    if (startIndex === -1) {
      for (let i = 13; i < data.values.length; i++) { // Começando da linha 14 (índice 13)
        const row = data.values[i];
        if (row && row.length >= 7) { // Verificar se tem dados suficientes para ser um aluno
          // Verificar se a linha parece conter dados de aluno (nome, valor, data)
          if (row[0] && row[1] && row[2]) {
            const valorStr = row[1]?.toString() || "";
            // Se a linha tem nome e o segundo campo parece ser um valor monetário (contém R$)
            if (valorStr.includes("R$")) {
              startIndex = i;
              break;
            }
          }
        }
      }
    }
    
    // Se ainda não encontramos o início, usamos uma abordagem padrão
    if (startIndex === -1) {
      startIndex = 14; // Começamos da linha 15 (índice 14) por padrão
    }
    
    // Processar os dados dos alunos a partir do índice de início
    for (let i = startIndex; i < data.values.length; i++) {
      const row = data.values[i];
      if (!row || !row[0] || row[0].trim() === "") continue; // Pula linhas vazias
      
      // Verificar se a linha tem formato de valor monetário na segunda coluna
      const valorStr = row[1]?.toString() || "";
      if (!valorStr.includes("R$")) continue; // Pula se não parece ser um aluno
      
      // Determinar status baseado na lógica de negócios
      // Por padrão, começam como inadimplentes
      let status: Status = "inadimplente";
      
      // Mapear valores da planilha para o objeto Student
      const student: Student = {
        id: `student-${i}`,
        nome: row[0] || "",
        curso: row[1] || "",
        valor: parseFloat(valorStr.replace("R$", "").replace(".", "").replace(",", ".")) || 0,
        dataVencimento: row[2] || "",
        diasAtraso: parseInt(row[3] ? row[3].replace(/\D/g, "") : "0", 10) || 0,
        followUp: row[6] || "",
        email: row[4] || "",
        telefone: row[5] || "",
        observacoes: row[5] || "",
        status
      };
      
      students.push(student);
    }
    
    return students;
  } catch (error) {
    console.error("Erro ao carregar dados da planilha:", error);
    toast.error("Erro ao carregar dados da planilha");
    return [];
  }
}

// Função auxiliar para formatar valores monetários
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}
