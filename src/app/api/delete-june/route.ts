// Rota de API para excluir mês de junho/25
// Última alteração: Criação da rota de exclusão específica para junho

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Lista de todos os formatos possíveis de junho/25
    const monthsToDelete = [
      '06-2025',
      'JUNHO/25',
      'JUNHO/2025',
      'junho/25',
      'junho/2025',
      'Junho/25',
      'Junho/2025'
    ];
    
    for (const monthValue of monthsToDelete) {
      // Primeiro, excluir todos os alunos do mês
      const { error: studentsError } = await supabase
        .from('students')
        .delete()
        .eq('mes', monthValue);
      
      if (studentsError) {
        console.error(`Erro ao excluir alunos do mês ${monthValue}:`, studentsError);
      }
      
      // Depois, excluir o mês da tabela de meses disponíveis
      const { error: monthError } = await supabase
        .from('available_months')
        .delete()
        .eq('month_value', monthValue);
      
      if (monthError) {
        console.error(`Erro ao excluir mês ${monthValue}:`, monthError);
      }
    }
    
    // Verificar se ainda existe algum mês de junho
    const { data: remainingMonths, error: checkError } = await supabase
      .from('available_months')
      .select('month_value')
      .or('month_value.ilike.06-2025,month_value.ilike.%JUNHO%25');
    
    if (checkError) {
      return NextResponse.json({ error: 'Erro ao verificar meses restantes' }, { status: 500 });
    }
    
    if (remainingMonths && remainingMonths.length > 0) {
      for (const month of remainingMonths) {
        await supabase
          .from('students')
          .delete()
          .eq('mes', month.month_value);
        
        await supabase
          .from('available_months')
          .delete()
          .eq('month_value', month.month_value);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Mês de junho/25 excluído com sucesso',
      remainingMonths: remainingMonths || []
    });
    
  } catch (error) {
    console.error('Erro ao excluir mês:', error);
    return NextResponse.json({ error: 'Erro ao excluir mês' }, { status: 500 });
  }
} 