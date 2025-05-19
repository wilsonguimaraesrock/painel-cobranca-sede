
import { supabase } from "@/integrations/supabase/client";
import { Student, Status, StatusHistory } from "@/types";
import { toast } from "sonner";

// Converter um objeto Student do formato da aplicação para o formato do banco de dados
const convertToDbFormat = (student: Student) => {
  return {
    id: student.id, // Usar o UUID gerado
    nome: student.nome,
    curso: student.curso || "",
    valor: student.valor,
    data_vencimento: student.dataVencimento,
    dias_atraso: student.diasAtraso,
    follow_up: student.followUp,
    email: student.email || "",
    telefone: student.telefone || "",
    observacoes: student.observacoes || "",
    status: student.status,
    primeiro_contato: student.primeiroContato || "",
    ultimo_contato: student.ultimoContato || "",
    mes: student.mes
  };
};

// Converter um objeto do banco de dados para o formato da aplicação
const convertFromDbFormat = (dbStudent: any): Student => {
  return {
    id: dbStudent.id,
    nome: dbStudent.nome,
    curso: dbStudent.curso || "",
    valor: parseFloat(dbStudent.valor),
    dataVencimento: dbStudent.data_vencimento,
    diasAtraso: dbStudent.dias_atraso,
    followUp: dbStudent.follow_up || "",
    email: dbStudent.email || "",
    telefone: dbStudent.telefone || "",
    observacoes: dbStudent.observacoes || "",
    status: dbStudent.status as Status,
    primeiroContato: dbStudent.primeiro_contato || "",
    ultimoContato: dbStudent.ultimo_contato || "",
    mes: dbStudent.mes
  };
};

// Salvar estudantes no banco de dados
export const saveStudents = async (students: Student[], mes: string): Promise<void> => {
  try {
    // Primeiro, verificamos se já existem estudantes para este mês
    const { data: existingStudents } = await supabase
      .from('students')
      .select('id')
      .eq('mes', mes);
      
    // Se existem, removemos todos para inserir os novos
    if (existingStudents && existingStudents.length > 0) {
      await supabase
        .from('students')
        .delete()
        .eq('mes', mes);
    }
    
    // Inserimos os novos estudantes
    const dbStudents = students.map(student => convertToDbFormat(student));
    
    // Inserir em lotes de 20 para evitar problemas com requisições muito grandes
    const chunkSize = 20;
    for (let i = 0; i < dbStudents.length; i += chunkSize) {
      const chunk = dbStudents.slice(i, i + chunkSize);
      const { error } = await supabase
        .from('students')
        .insert(chunk);
      
      if (error) {
        console.error("Erro ao salvar lote de estudantes:", error);
        throw error;
      }
    }
    
    toast.success(`Dados salvos com sucesso no banco de dados`, {
      description: `${students.length} alunos salvos para o mês ${mes}`
    });
  } catch (error) {
    console.error("Erro ao salvar estudantes:", error);
    toast.error("Erro ao salvar dados no banco de dados", {
      description: "Verifique sua conexão e tente novamente."
    });
    throw error;
  }
};

// Obter estudantes do banco de dados para um mês específico
export const getStudents = async (mes: string): Promise<Student[]> => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('mes', mes);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Converter para o formato da aplicação
    const students = data.map(convertFromDbFormat);
    
    // Obter o histórico de status para cada estudante
    for (const student of students) {
      const { data: historyData } = await supabase
        .from('status_history')
        .select('*')
        .eq('student_id', student.id);
      
      if (historyData && historyData.length > 0) {
        student.statusHistory = historyData.map(history => ({
          oldStatus: history.old_status as Status,
          newStatus: history.new_status as Status,
          changedBy: history.changed_by,
          changedAt: new Date(history.changed_at)
        }));
      }
    }
    
    return students;
  } catch (error) {
    console.error("Erro ao obter estudantes:", error);
    toast.error("Erro ao carregar dados do banco de dados", {
      description: "Verifique sua conexão e tente novamente."
    });
    throw error;
  }
};

// Verificar se existem dados para um mês específico
export const checkMonthData = async (mes: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('count', { count: 'exact' })
      .eq('mes', mes);
    
    if (error) throw error;
    
    return data ? data.length > 0 : false;
  } catch (error) {
    console.error("Erro ao verificar dados do mês:", error);
    return false;
  }
};

// Atualizar o status de um estudante
export const updateStudentStatus = async (
  studentId: string, 
  oldStatus: Status, 
  newStatus: Status, 
  changedBy: string
): Promise<void> => {
  try {
    // Atualizar o status do estudante
    const { error: updateError } = await supabase
      .from('students')
      .update({ status: newStatus })
      .eq('id', studentId);
    
    if (updateError) throw updateError;
    
    // Adicionar ao histórico
    const { error: historyError } = await supabase
      .from('status_history')
      .insert({
        student_id: studentId,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: changedBy
      });
    
    if (historyError) throw historyError;
    
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    toast.error("Erro ao atualizar status do aluno", {
      description: "Verifique sua conexão e tente novamente."
    });
    throw error;
  }
};
