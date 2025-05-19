
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
    // Buscamos diretamente as linhas relevantes (a partir da linha 3)
    const range = `${sheetName}!A1:H50`;
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error("Falha ao carregar dados da planilha");
    }
    
    const data: SheetData = await response.json();
    
    if (!data.values || data.values.length < 3) { // Pelo menos linha 1, 2 (cabeçalho) e 3 (primeiro aluno)
      console.log("Dados insuficientes na planilha");
      return [];
    }

    console.log("Dados recebidos da API:", data.values);
    
    // Converter dados da planilha para objetos Student, começando da linha 3
    // Sabemos que a linha 1 tem o título "INADIMPLENCIAS" 
    // Linha 2 tem cabeçalhos: NOME, VALOR, VENCIMEN., etc
    // Linha 3 em diante tem os dados dos alunos
    const students: Student[] = [];
    
    // Começar da linha 3 (índice 2 no array)
    for (let i = 2; i < data.values.length; i++) {
      const row = data.values[i];
      
      // Verificar se a linha tem dados relevantes (ou seja, tem um nome)
      if (!row || !row[0] || row[0].trim() === "") continue;
      
      // Verificar se chegamos ao fim da lista de alunos
      // Muitas planilhas têm linhas em branco depois dos dados
      if (i > 2 && (!row[1] || row[1].trim() === "")) continue;
      
      // Identificar o status inicial (por padrão, são inadimplentes)
      let status: Status = "inadimplente";
      
      // Extrair o valor e formatar corretamente
      const valorString = row[1] || "";
      const valor = valorString.replace(/[^\d,]/g, "").replace(",", ".");
      
      // Extrair dias de atraso (se aplicável)
      let diasAtraso = 0;
      if (row[0] && row[2]) {
        // Calcular dias de atraso com base na data atual e data de vencimento
        const partes = row[2]?.toString().split('/') || [];
        if (partes.length === 2) {
          const dia = parseInt(partes[0]);
          const mes = parseInt(partes[1]) - 1; // Mês em JS é 0-based
          const dataVencimento = new Date(2023, mes, dia); // Assumindo 2023
          const hoje = new Date();
          const diff = hoje.getTime() - dataVencimento.getTime();
          diasAtraso = Math.floor(diff / (1000 * 60 * 60 * 24));
          if (diasAtraso < 0) diasAtraso = 0;
        }
      }
      
      const student: Student = {
        id: `student-${i}`,
        nome: row[0] || "",
        curso: "", // Não temos o curso no exemplo da planilha
        valor: parseFloat(valor) || 0,
        dataVencimento: row[2] || "",
        diasAtraso: diasAtraso,
        followUp: row[7] || "", // DATA DO FOLLOW está na coluna H (índice 7)
        email: "", // Não temos o email na planilha atual
        telefone: "", // Não temos o telefone na planilha atual
        observacoes: row[6] || "", // OBSERVAÇÃO está na coluna G (índice 6)
        status
      };
      
      console.log(`Processando aluno ${i}: ${student.nome}, valor: ${student.valor}`);
      students.push(student);
    }
    
    console.log(`Total de alunos extraídos: ${students.length}`);
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
