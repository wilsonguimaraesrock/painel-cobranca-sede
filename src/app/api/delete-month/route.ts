
// Rota de API para excluir um mês
// Última alteração: Criação da rota de exclusão de mês

import { deleteMonth } from "@/services/monthsService";

export async function POST(request: Request) {
  try {
    const { monthValue } = await request.json();
    
    if (!monthValue) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Mês não especificado" 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const success = await deleteMonth(monthValue);
    
    if (success) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Mês excluído com sucesso" 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Erro ao excluir mês" 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error("Erro ao excluir mês:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Erro ao excluir mês" 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
