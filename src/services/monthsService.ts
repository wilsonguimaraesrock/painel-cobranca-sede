
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Função para converter MM-YYYY para formato por extenso
export const formatMonthDisplay = (monthValue: string): string => {
  // Validar se o valor existe e está no formato correto
  if (!monthValue || typeof monthValue !== 'string') {
    console.warn('Invalid month value:', monthValue);
    return monthValue || '';
  }

  const parts = monthValue.split('-');
  if (parts.length !== 2) {
    console.warn('Month value not in MM-YYYY format:', monthValue);
    return monthValue;
  }

  const [month, year] = parts;
  
  // Validar se month e year existem
  if (!month || !year) {
    console.warn('Invalid month or year in:', monthValue);
    return monthValue;
  }

  const monthNames = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];
  
  const monthIndex = parseInt(month) - 1;
  
  // Validar se o índice do mês é válido
  if (monthIndex < 0 || monthIndex >= 12 || isNaN(monthIndex)) {
    console.warn('Invalid month index:', month, 'in value:', monthValue);
    return monthValue;
  }
  
  const shortYear = year.length >= 2 ? year.slice(-2) : year;
  
  return `${monthNames[monthIndex]}/${shortYear}`;
};

// Obter todos os meses disponíveis do banco de dados
export const getAvailableMonthsFromDatabase = async (): Promise<string[]> => {
  try {
    console.log("Buscando meses disponíveis no banco de dados...");
    
    const { data, error } = await supabase
      .from('available_months')
      .select('month_value')
      .eq('is_active', true)
      .order('month_value', { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar meses do banco:", error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log("Nenhum mês encontrado no banco de dados");
      return [];
    }
    
    const months = data.map(item => item.month_value);
    console.log(`Encontrados ${months.length} meses no banco:`, months);
    
    return months;
  } catch (error) {
    console.error("Erro ao obter meses do banco:", error);
    return [];
  }
};

// Criar um novo mês no banco de dados
export const createNewMonthInDatabase = async (monthValue: string): Promise<boolean> => {
  try {
    console.log(`Criando novo mês no banco: ${monthValue}`);
    
    const displayName = formatMonthDisplay(monthValue);
    
    const { error } = await supabase
      .from('available_months')
      .insert({
        month_value: monthValue,
        display_name: displayName,
        is_active: true
      });
    
    if (error) {
      if (error.code === "23505") { // Unique constraint violation
        console.warn("Mês já existe no banco:", monthValue);
        toast.error("Este mês já existe");
        return false;
      }
      console.error("Erro ao criar mês no banco:", error);
      toast.error("Erro ao criar novo mês no banco de dados");
      return false;
    }
    
    console.log(`Mês ${monthValue} criado com sucesso no banco`);
    return true;
  } catch (error) {
    console.error("Erro ao criar mês:", error);
    toast.error("Erro ao criar novo mês");
    return false;
  }
};

// Verificar se um mês existe no banco de dados
export const checkMonthExistsInDatabase = async (monthValue: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('available_months')
      .select('id')
      .eq('month_value', monthValue)
      .eq('is_active', true)
      .maybeSingle();
    
    if (error) {
      console.error("Erro ao verificar mês no banco:", error);
      return false;
    }
    
    return data !== null;
  } catch (error) {
    console.error("Erro ao verificar mês:", error);
    return false;
  }
};

// Verificar se existem dados de estudantes para um mês específico
export const checkStudentsForMonth = async (monthValue: string): Promise<number> => {
  try {
    console.log(`Verificando estudantes para o mês: ${monthValue}`);
    
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('mes', monthValue);
    
    if (error) {
      console.error("Erro ao verificar estudantes do mês:", error);
      return 0;
    }
    
    const studentCount = count || 0;
    console.log(`Encontrados ${studentCount} estudantes para o mês ${monthValue}`);
    
    return studentCount;
  } catch (error) {
    console.error("Erro ao verificar estudantes:", error);
    return 0;
  }
};

// Garantir que maio/25 esteja disponível
export const ensureMaioAvailable = async (): Promise<void> => {
  try {
    console.log("Verificando se maio/25 está disponível...");
    
    const maioExists = await checkMonthExistsInDatabase('05-2025');
    
    if (!maioExists) {
      console.log("Maio/25 não encontrado, criando...");
      await createNewMonthInDatabase('05-2025');
    } else {
      console.log("Maio/25 já está disponível no banco");
    }
    
    // Verificar se há estudantes para maio
    const studentCount = await checkStudentsForMonth('05-2025');
    if (studentCount > 0) {
      console.log(`Maio/25 tem ${studentCount} estudantes cadastrados`);
    }
  } catch (error) {
    console.error("Erro ao garantir maio disponível:", error);
  }
};
