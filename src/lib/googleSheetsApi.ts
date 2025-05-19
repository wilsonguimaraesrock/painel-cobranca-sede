
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
    return data.sheets
      .filter((sheet: any) => !sheet.properties.hidden)
      .map((sheet: any) => sheet.properties.title);
  } catch (error) {
    console.error("Erro ao obter abas da planilha:", error);
    toast.error("Erro ao obter abas da planilha");
    return [];
  }
}

// Obtém dados da planilha para o mês selecionado
export async function getSheetData(sheetName: string): Promise<Student[]> {
  try {
    // Buscamos um range maior para garantir que todos os alunos sejam pegos
    const range = `${sheetName}!A1:H100`;
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error("Falha ao carregar dados da planilha");
    }
    
    const data: SheetData = await response.json();
    
    if (!data.values || data.values.length < 3) {
      console.log("Dados insuficientes na planilha");
      return [];
    }

    console.log("Dados recebidos da API:", data.values);
    
    // Array para armazenar os alunos
    const students: Student[] = [];
    
    // Encontrar a linha que contém os cabeçalhos corretos (NOME, VALOR, VENCIMEN.)
    let headerIndex = -1;
    for (let i = 0; i < data.values.length; i++) {
      const row = data.values[i];
      if (row && row[0] === "NOME" && row[1] === "VALOR" && row[2]?.includes("VENCIMEN")) {
        headerIndex = i;
        break;
      }
    }
    
    // Se não encontramos o cabeçalho, retornar lista vazia
    if (headerIndex === -1) {
      console.error("Cabeçalhos não encontrados na planilha");
      return [];
    }
    
    // Começar a processar a partir da linha após o cabeçalho
    for (let i = headerIndex + 1; i < data.values.length; i++) {
      const row = data.values[i];
      
      // Verificar se a linha tem dados válidos (nome e valor)
      if (!row || !row[0] || row[0].trim() === "" || !row[1]) {
        continue;
      }
      
      const nome = row[0].trim();
      
      // Se a linha contém RETIRADOS DA PLANILHA ou algum outro marcador, pula
      if (nome.includes("RETIRADOS") || nome.includes("Bonificação")) {
        continue;
      }
      
      // Validar que é uma linha de aluno (tem nome e dados financeiros)
      const valorString = row[1]?.toString() || "";
      if (!valorString.includes("R$") && !valorString.includes("$")) {
        continue;
      }
      
      // Extrair o valor formatado corretamente
      const valor = parseFloat(
        valorString
          .replace(/[^\d,\.]/g, "")
          .replace(",", ".")
      );
      
      // Calcular dias de atraso com o ano atual
      let diasAtraso = 0;
      if (row[2]) { // Data de vencimento
        const partesData = row[2].toString().split('/');
        
        if (partesData.length === 2) {
          const dia = parseInt(partesData[0]);
          const mes = parseInt(partesData[1]) - 1; // 0-based em JS
          const hoje = new Date();
          const anoAtual = hoje.getFullYear();
          
          // Criar data de vencimento com o ano atual
          const dataVencimento = new Date(anoAtual, mes, dia);
          
          // Se o mês de vencimento já passou (estamos em dezembro e o vencimento é de janeiro)
          // assumimos que é do próximo ano
          if (mes < hoje.getMonth() && hoje.getMonth() > 10) {
            dataVencimento.setFullYear(anoAtual + 1);
          }
          
          // Se o mês atual é janeiro e o vencimento é de dezembro, assumimos que o vencimento foi no ano anterior
          if (mes > hoje.getMonth() && hoje.getMonth() < 1) {
            dataVencimento.setFullYear(anoAtual - 1);
          }
          
          const diff = hoje.getTime() - dataVencimento.getTime();
          diasAtraso = Math.floor(diff / (1000 * 60 * 60 * 24));
          if (diasAtraso < 0) diasAtraso = 0;
        }
      }
      
      // Criar o objeto aluno
      const student: Student = {
        id: `student-${i}`,
        nome: nome,
        curso: "", // Não temos essa informação na planilha
        valor: isNaN(valor) ? 0 : valor,
        dataVencimento: row[2] || "",
        diasAtraso: diasAtraso,
        followUp: row[7] || "", // DATA DO FOLLOW está na coluna H (índice 7)
        email: "", // Não temos na planilha
        telefone: "", // Não temos na planilha
        observacoes: row[6] || "", // OBSERVAÇÃO está na coluna G (índice 6)
        status: "inadimplente" as Status
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
