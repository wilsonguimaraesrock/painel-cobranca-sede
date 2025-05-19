import { Student, SheetData, Status, StatusHistory } from "@/types";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

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
      
      // Calcular dias de atraso corretamente
      let diasAtraso = 0;
      if (row[2]) { // Data de vencimento
        const partesData = row[2].toString().split('/');
        
        if (partesData.length === 3) {
          // Formato completo: DD/MM/YYYY
          const dia = parseInt(partesData[0]);
          const mes = parseInt(partesData[1]) - 1; // 0-based em JS
          const ano = parseInt(partesData[2]);
          
          // Criar data de vencimento com ano, mês e dia
          const dataVencimento = new Date(ano, mes, dia);
          const hoje = new Date();
          
          // Calcular diferença em dias
          const diff = hoje.getTime() - dataVencimento.getTime();
          diasAtraso = Math.floor(diff / (1000 * 60 * 60 * 24));
          if (diasAtraso < 0) diasAtraso = 0;
        } else if (partesData.length === 2) {
          // Formato simplificado: DD/MM (assumir ano atual)
          const dia = parseInt(partesData[0]);
          const mes = parseInt(partesData[1]) - 1; // 0-based em JS
          const hoje = new Date();
          const ano = hoje.getFullYear();
          
          // Criar data de vencimento
          const dataVencimento = new Date(ano, mes, dia);
          
          // Se a data de vencimento está no futuro mas o mês já é anterior ao atual,
          // significa que o vencimento já passou e estamos no ano seguinte
          if (dataVencimento > hoje && mes < hoje.getMonth()) {
            dataVencimento.setFullYear(ano - 1);
          }
          
          // Se a data de vencimento está no passado mas o mês é posterior ao atual,
          // significa que o vencimento ainda não chegou e estamos no ano anterior
          if (dataVencimento < hoje && mes > hoje.getMonth()) {
            dataVencimento.setFullYear(ano + 1);
          }
          
          // Calcular diferença em dias
          const diff = hoje.getTime() - dataVencimento.getTime();
          diasAtraso = Math.floor(diff / (1000 * 60 * 60 * 24));
          if (diasAtraso < 0) diasAtraso = 0;
        }
      }
      
      // Criar o objeto aluno - IMPORTANTE: Gerar um UUID válido para o ID
      const student: Student = {
        id: uuidv4(), // Gerando UUID válido para uso com Supabase
        nome: nome,
        curso: "", // Não temos essa informação na planilha
        valor: isNaN(valor) ? 0 : valor,
        dataVencimento: row[2] || "",
        diasAtraso: diasAtraso,
        followUp: row[7] || "", // DATA DO FOLLOW está na coluna H (índice 7)
        email: "", // Não temos na planilha
        telefone: "", // Não temos na planilha
        observacoes: row[6] || "", // OBSERVAÇÃO está na coluna G (índice 6)
        primeiroContato: row[3] || "", // PRIMEIRO CONTATO está na coluna D (índice 3)
        ultimoContato: row[4] || "", // ÚLTIMO CONTATO está na coluna E (índice 4)
        status: "inadimplente" as Status,
        statusHistory: [], // Inicializa o histórico de status vazio
        mes: sheetName // Adicionamos o mês corretamente aqui
      };
      
      console.log(`Processando aluno ${i}: ${student.nome}, valor: ${student.valor}, vencimento: ${student.dataVencimento}, dias atraso: ${student.diasAtraso}, primeiro contato: ${student.primeiroContato}, último contato: ${student.ultimoContato}, mês: ${student.mes}, id: ${student.id}`);
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
