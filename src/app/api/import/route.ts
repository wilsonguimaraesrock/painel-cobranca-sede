// Rota de API para importar alunos de maio para junho
// Última alteração: Criação da rota de importação

import { importStudentsFromPreviousMonth } from "@/services/monthsService";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Iniciando importação de alunos de maio para junho...");
    await importStudentsFromPreviousMonth("06-2024");
    console.log("Importação concluída com sucesso!");
    
    return NextResponse.json({ 
      success: true, 
      message: "Alunos importados com sucesso!" 
    });
  } catch (error) {
    console.error("Erro durante a importação:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Erro ao importar alunos" 
    }, { status: 500 });
  }
} 