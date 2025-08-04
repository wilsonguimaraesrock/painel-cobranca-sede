/**
 * 💰 SERVIÇO DE FILTRO DE PAGAMENTOS POR MÊS
 * 
 * Este serviço filtra pagamentos realizados especificamente no mês alvo
 * Funcionalidade: Coluna "Pagamento Realizado" mostra apenas pagamentos do mês atual
 * 
 * Criado em: 04/08/2025
 */

import { supabase } from "@/integrations/supabase/client";
import { Student } from "@/types";

/**
 * Filtra alunos que pagaram especificamente no mês alvo
 * Verifica o histórico de status para determinar quando o pagamento foi feito
 */
export const getPaymentsForMonth = async (
  allStudents: Student[],
  targetMonth: string
): Promise<Student[]> => {
  try {
    console.log(`💰 Filtrando pagamentos para o mês: ${targetMonth}`);
    
    const paymentsInMonth: Student[] = [];
    
    for (const student of allStudents) {
      // Só considerar quem tem status "pagamento-feito"
      if (student.status !== "pagamento-feito") {
        continue;
      }
      
      // Verificar se o pagamento foi feito no mês especificado
      const paymentInTargetMonth = await wasPaymentMadeInMonth(student.id, targetMonth);
      
      if (paymentInTargetMonth) {
        paymentsInMonth.push(student);
      }
    }
    
    console.log(`✅ Encontrados ${paymentsInMonth.length} pagamentos em ${targetMonth}`);
    return paymentsInMonth;
    
  } catch (error) {
    console.error("❌ Erro ao filtrar pagamentos por mês:", error);
    return [];
  }
};

/**
 * Verifica se o pagamento foi feito especificamente no mês alvo
 * Consulta o histórico de status para ver quando mudou para "pagamento-feito"
 */
const wasPaymentMadeInMonth = async (
  studentId: string,
  targetMonth: string
): Promise<boolean> => {
  try {
    // Buscar histórico de status para este aluno
    const { data: history, error } = await supabase
      .from('status_history')
      .select('*')
      .eq('student_id', studentId)
      .eq('new_status', 'pagamento-feito')
      .order('changed_at', { ascending: false })
      .limit(1);
    
    if (error || !history || history.length === 0) {
      return false;
    }
    
    // Pegar a data da mudança para "pagamento-feito"
    const paymentDate = new Date(history[0].changed_at);
    
    // Verificar se a data está dentro do mês alvo
    return isDateInMonth(paymentDate, targetMonth);
    
  } catch (error) {
    console.error(`❌ Erro ao verificar pagamento para ${studentId}:`, error);
    return false;
  }
};

/**
 * Verifica se uma data está dentro de um mês específico
 */
const isDateInMonth = (date: Date, monthValue: string): boolean => {
  try {
    // monthValue formato: "MM-YYYY" (ex: "08-2025")
    const [month, year] = monthValue.split('-').map(num => parseInt(num));
    
    const dateMonth = date.getMonth() + 1; // getMonth() retorna 0-11
    const dateYear = date.getFullYear();
    
    return dateMonth === month && dateYear === year;
  } catch (error) {
    console.error("❌ Erro ao verificar data no mês:", error);
    return false;
  }
}; 