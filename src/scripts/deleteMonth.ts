// Script para excluir meses de junho/2025
// Última alteração: Criação do script de exclusão

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

async function deleteMonth(monthValue: string) {
  try {
    console.log(`Excluindo mês ${monthValue} e seus alunos...`);
    
    // Primeiro, excluir todos os alunos do mês
    const { error: studentsError } = await supabase
      .from('students')
      .delete()
      .eq('mes', monthValue);
    
    if (studentsError) {
      console.error("Erro ao excluir alunos:", studentsError);
      return false;
    }
    
    // Depois, excluir o mês da tabela de meses disponíveis
    const { error: monthError } = await supabase
      .from('available_months')
      .delete()
      .eq('month_value', monthValue);
    
    if (monthError) {
      console.error("Erro ao excluir mês:", monthError);
      return false;
    }
    
    console.log(`Mês ${monthValue} excluído com sucesso!`);
    return true;
  } catch (error) {
    console.error("Erro:", error);
    return false;
  }
}

async function main() {
  try {
    // Excluir os dois formatos possíveis de junho/2025
    const monthsToDelete = ['06-2025', 'JUNHO/25'];
    
    for (const month of monthsToDelete) {
      const success = await deleteMonth(month);
      if (success) {
        console.log(`Mês ${month} excluído com sucesso!`);
      } else {
        console.error(`Erro ao excluir mês ${month}`);
      }
    }
    
    console.log("Processo de exclusão concluído!");
  } catch (error) {
    console.error("Erro durante o processo:", error);
  }
}

main(); 