
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
    // Intervalo para o cabeçalho (linha 2) e os dados dos alunos (linhas 3 a 30)
    const range = `${sheetName}!A3:J30`;
    
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
    
    // Processar cada linha como um estudante (todas as linhas são estudantes agora)
    for (let i = 0; i < data.values.length; i++) {
      const row = data.values[i];
      if (!row || !row[0]) continue; // Pula linhas vazias
      
      // Determinar status baseado na lógica de negócios
      // Por padrão, começam como inadimplentes
      let status: Status = "inadimplente";
      
      // Mapear valores da planilha para o objeto Student
      const student: Student = {
        id: `student-${i}`,
        nome: row[0] || "",
        curso: row[1] || "",
        valor: parseFloat(row[2]?.replace("R$", "").replace(".", "").replace(",", ".")) || 0,
        dataVencimento: row[3] || "",
        diasAtraso: parseInt(row[4] || "0", 10),
        followUp: row[5] || "",
        email: row[6] || "",
        telefone: row[7] || "",
        observacoes: row[8] || "",
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
