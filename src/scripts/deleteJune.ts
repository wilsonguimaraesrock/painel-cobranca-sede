// Script para excluir mês de junho/25
// Última alteração: Criação do script de exclusão específico para junho

import { supabase } from "@/integrations/supabase/client";

async function deleteMonth(monthValue: string) {
  try {
    console.log(`Tentando excluir mês: ${monthValue}`);
    
    // Primeiro, excluir todos os alunos do mês
    const { error: studentsError } = await supabase
      .from('students')
      .delete()
      .eq('mes', monthValue);
    
    if (studentsError) {
      console.error(`Erro ao excluir alunos do mês ${monthValue}:`, studentsError);
    } else {
      console.log(`Alunos do mês ${monthValue} excluídos com sucesso`);
    }
    
    // Depois, excluir o mês da tabela de meses disponíveis
    const { error: monthError } = await supabase
      .from('available_months')
      .delete()
      .eq('month_value', monthValue);
    
    if (monthError) {
      console.error(`Erro ao excluir mês ${monthValue}:`, monthError);
    } else {
      console.log(`Mês ${monthValue} excluído com sucesso`);
    }
  } catch (error) {
    console.error(`Erro ao processar mês ${monthValue}:`, error);
  }
}

async function main() {
  try {
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
    
    console.log("Iniciando exclusão de todos os formatos de junho/25...");
    
    for (const month of monthsToDelete) {
      await deleteMonth(month);
    }
    
    // Verificar se ainda existe algum mês de junho
    const { data: remainingMonths, error: checkError } = await supabase
      .from('available_months')
      .select('month_value')
      .or('month_value.ilike.06-2025,month_value.ilike.%JUNHO%25');
    
    if (checkError) {
      console.error("Erro ao verificar meses restantes:", checkError);
    } else if (remainingMonths && remainingMonths.length > 0) {
      console.log("Meses de junho ainda encontrados:", remainingMonths);
      for (const month of remainingMonths) {
        await deleteMonth(month.month_value);
      }
    } else {
      console.log("Nenhum mês de junho encontrado após a limpeza");
    }
    
    console.log("Processo de exclusão concluído!");
  } catch (error) {
    console.error("Erro durante o processo:", error);
  }
}

main(); 