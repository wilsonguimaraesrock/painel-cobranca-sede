// Rota de API para excluir um mês
// Última alteração: Criação da rota de exclusão de mês

import { deleteMonth } from "@/services/monthsService";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { monthValue } = await request.json();
    
    if (!monthValue) {
      return NextResponse.json({ 
        success: false, 
        message: "Mês não especificado" 
      }, { status: 400 });
    }
    
    const success = await deleteMonth(monthValue);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: "Mês excluído com sucesso" 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: "Erro ao excluir mês" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Erro ao excluir mês:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Erro ao excluir mês" 
    }, { status: 500 });
  }
} 