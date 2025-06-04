// Script para verificar e corrigir problemas no banco de dados
// Última alteração: Criação do script de verificação

import { supabase, supabaseUtils } from "@/config/supabase";
import { toast } from "sonner";

// Função para verificar a integridade dos dados
export const checkDatabaseIntegrity = async (mes: string): Promise<void> => {
  try {
    console.log(`Iniciando verificação de integridade para o mês ${mes}`);
    
    // Verificar conexão
    const { error: connectionError } = await supabase.from('students').select('count').limit(1);
    if (connectionError) {
      throw new Error("Erro de conexão com o banco de dados");
    }
    
    // Verificar dados do mês
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('mes', mes);
    
    if (studentsError) {
      throw studentsError;
    }
    
    if (!students || students.length === 0) {
      console.log(`Nenhum dado encontrado para o mês ${mes}`);
      return;
    }
    
    // Verificar integridade dos dados
    const problems = [];
    
    for (const student of students) {
      // Verificar campos obrigatórios
      if (!student.nome || !student.valor || !student.status) {
        problems.push({
          id: student.id,
          type: 'missing_fields',
          message: 'Campos obrigatórios ausentes'
        });
      }
      
      // Verificar valores numéricos
      if (isNaN(Number(student.valor)) || Number(student.valor) < 0) {
        problems.push({
          id: student.id,
          type: 'invalid_value',
          message: 'Valor inválido'
        });
      }
      
      // Verificar status válido
      const validStatuses = ['inadimplente', 'mensagem-enviada', 'resposta-recebida', 'pagamento-feito'];
      if (!validStatuses.includes(student.status)) {
        problems.push({
          id: student.id,
          type: 'invalid_status',
          message: 'Status inválido'
        });
      }
    }
    
    // Reportar problemas encontrados
    if (problems.length > 0) {
      console.warn(`Encontrados ${problems.length} problemas no banco de dados`);
      problems.forEach(problem => {
        console.warn(`ID ${problem.id}: ${problem.message}`);
      });
      
      toast.warning(`Encontrados ${problems.length} problemas no banco de dados`, {
        description: "Verifique o console para mais detalhes"
      });
    } else {
      console.log("Nenhum problema encontrado no banco de dados");
      toast.success("Verificação concluída", {
        description: "Nenhum problema encontrado no banco de dados"
      });
    }
  } catch (error) {
    console.error("Erro ao verificar integridade do banco de dados:", error);
    const errorInfo = supabaseUtils.handleError(error);
    toast.error(errorInfo.message, {
      description: errorInfo.description
    });
    throw error;
  }
};

// Função para corrigir problemas encontrados
export const fixDatabaseProblems = async (mes: string): Promise<void> => {
  try {
    console.log(`Iniciando correção de problemas para o mês ${mes}`);
    
    // Verificar dados do mês
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('mes', mes);
    
    if (studentsError) {
      throw studentsError;
    }
    
    if (!students || students.length === 0) {
      console.log(`Nenhum dado encontrado para o mês ${mes}`);
      return;
    }
    
    // Corrigir problemas
    let fixedCount = 0;
    
    for (const student of students) {
      const updates: any = {};
      let needsUpdate = false;
      
      // Corrigir campos obrigatórios
      if (!student.nome) {
        updates.nome = 'Nome não informado';
        needsUpdate = true;
      }
      
      if (!student.valor || isNaN(Number(student.valor)) || Number(student.valor) < 0) {
        updates.valor = 0;
        needsUpdate = true;
      }
      
      if (!student.status) {
        updates.status = 'inadimplente';
        needsUpdate = true;
      }
      
      // Aplicar correções se necessário
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('students')
          .update(updates)
          .eq('id', student.id);
        
        if (updateError) {
          console.error(`Erro ao corrigir estudante ${student.id}:`, updateError);
        } else {
          fixedCount++;
        }
      }
    }
    
    // Reportar correções
    if (fixedCount > 0) {
      console.log(`Corrigidos ${fixedCount} problemas no banco de dados`);
      toast.success("Correções aplicadas", {
        description: `${fixedCount} problemas foram corrigidos no banco de dados`
      });
    } else {
      console.log("Nenhuma correção necessária");
      toast.info("Verificação concluída", {
        description: "Nenhuma correção foi necessária"
      });
    }
  } catch (error) {
    console.error("Erro ao corrigir problemas do banco de dados:", error);
    const errorInfo = supabaseUtils.handleError(error);
    toast.error(errorInfo.message, {
      description: errorInfo.description
    });
    throw error;
  }
};

// Função para verificar dados no Supabase
export const checkSupabaseData = async (mes: string): Promise<void> => {
  try {
    console.log(`Verificando dados no Supabase para o mês ${mes}`);
    
    // Verificar conexão
    const { error: connectionError } = await supabase.from('students').select('count').limit(1);
    if (connectionError) {
      throw new Error("Erro de conexão com o banco de dados");
    }
    
    // Verificar dados do mês
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('mes', mes);
    
    if (studentsError) {
      throw studentsError;
    }
    
    if (!students || students.length === 0) {
      console.log(`Nenhum dado encontrado no Supabase para o mês ${mes}`);
      toast.info("Verificação concluída", {
        description: "Nenhum dado encontrado no Supabase para este mês"
      });
      return;
    }
    
    // Mostrar informações sobre os dados encontrados
    console.log(`Encontrados ${students.length} registros no Supabase para o mês ${mes}`);
    
    // Agrupar por status
    const statusCount = students.reduce((acc: any, student) => {
      acc[student.status] = (acc[student.status] || 0) + 1;
      return acc;
    }, {});
    
    // Calcular total em inadimplência
    const totalInadimplencia = students
      .filter(s => s.status !== 'pagamento-feito')
      .reduce((total, student) => total + (Number(student.valor) || 0), 0);
    
    // Mostrar resumo
    console.log("Resumo dos dados:");
    console.log("- Total de registros:", students.length);
    console.log("- Distribuição por status:", statusCount);
    console.log("- Total em inadimplência:", totalInadimplencia);
    
    // Mostrar toast com informações
    toast.success("Dados encontrados no Supabase", {
      description: `${students.length} registros encontrados para o mês ${mes}`
    });
    
    // Mostrar detalhes no console
    console.log("Detalhes dos registros:");
    students.forEach(student => {
      console.log(`- ID: ${student.id}`);
      console.log(`  Nome: ${student.nome}`);
      console.log(`  Status: ${student.status}`);
      console.log(`  Valor: ${student.valor}`);
      console.log(`  Data de vencimento: ${student.data_vencimento}`);
      console.log("---");
    });
    
  } catch (error) {
    console.error("Erro ao verificar dados no Supabase:", error);
    const errorInfo = supabaseUtils.handleError(error);
    toast.error(errorInfo.message, {
      description: errorInfo.description
    });
    throw error;
  }
}; 