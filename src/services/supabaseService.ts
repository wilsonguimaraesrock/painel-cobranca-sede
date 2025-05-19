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
    mes: dbStudent.mes,
    statusHistory: [] // Inicializa o histórico vazio para ser preenchido depois
  };
};

// Salvar estudantes no banco de dados
export const saveStudents = async (students: Student[], mes: string): Promise<void> => {
  try {
    console.log(`Iniciando salvamento de ${students.length} alunos para o mês ${mes}`);
    
    // Primeiro, verificamos se já existem estudantes para este mês
    const { data: existingStudents, error: checkError } = await supabase
      .from('students')
      .select('id')
      .eq('mes', mes);
      
    if (checkError) {
      console.error("Erro ao verificar estudantes existentes:", checkError);
      
      // Código de erro específico para violação de políticas RLS
      if (checkError.code === "42501") {
        console.warn("Erro de permissão no banco de dados, tentando inserir diretamente");
        
        // Tentativa de inserção direta sem verificação prévia
        const dbStudents = students.map(student => convertToDbFormat(student));
        
        // Inserir em lotes de 20 para evitar problemas com requisições muito grandes
        const chunkSize = 20;
        for (let i = 0; i < dbStudents.length; i += chunkSize) {
          const chunk = dbStudents.slice(i, i + chunkSize);
          const { error } = await supabase
            .from('students')
            .upsert(chunk, { onConflict: 'id' }); // Usar upsert para atualizar se existir
          
          if (error) {
            console.error("Erro ao salvar lote de estudantes:", error);
            throw error;
          }
        }
        
        toast.success(`Dados salvos com sucesso no banco de dados`, {
          description: `${students.length} alunos salvos para o mês ${mes}`
        });
        
        return;
      } else {
        throw checkError;
      }
    }
    
    // Se existem, removemos todos para inserir os novos
    if (existingStudents && existingStudents.length > 0) {
      console.log(`Encontrados ${existingStudents.length} alunos para o mês ${mes}, atualizando...`);
      
      // Em vez de excluir, vamos usar upsert para preservar os IDs existentes
      const dbStudents = students.map(student => convertToDbFormat(student));
      
      // Inserir em lotes de 20 para evitar problemas com requisições muito grandes
      const chunkSize = 20;
      for (let i = 0; i < dbStudents.length; i += chunkSize) {
        const chunk = dbStudents.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('students')
          .upsert(chunk, { onConflict: 'id' }); // Usar upsert para atualizar se existir
        
        if (error) {
          console.error("Erro ao atualizar lote de estudantes:", error);
          throw error;
        }
      }
    } else {
      console.log(`Nenhum aluno encontrado para o mês ${mes}, inserindo novos...`);
      
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
          
          // Código de erro específico para violação de políticas RLS
          if (error.code === "42501") {
            toast.error("Erro de permissão no banco de dados", {
              description: "Contate o administrador para configurar as políticas de acesso."
            });
            return;
          }
          
          throw error;
        }
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

// Salvar todos os estudantes modificados no banco de dados
export const saveAllStudents = async (students: Student[]): Promise<void> => {
  try {
    console.log(`Iniciando salvamento forçado de ${students.length} alunos`);
    
    if (students.length === 0) {
      console.warn("Nenhum aluno para salvar");
      return;
    }
    
    // Agrupar estudantes por mês para manter a consistência
    const studentsByMonth: Record<string, Student[]> = {};
    
    students.forEach(student => {
      if (!studentsByMonth[student.mes]) {
        studentsByMonth[student.mes] = [];
      }
      studentsByMonth[student.mes].push(student);
    });
    
    // Salvar cada grupo de estudantes separadamente
    for (const [mes, studentsForMonth] of Object.entries(studentsByMonth)) {
      console.log(`Salvando ${studentsForMonth.length} alunos para o mês ${mes}`);
      
      // Converter para o formato do banco de dados
      const dbStudents = studentsForMonth.map(student => convertToDbFormat(student));
      
      // Inserir em lotes de 20 para evitar problemas com requisições muito grandes
      const chunkSize = 20;
      for (let i = 0; i < dbStudents.length; i += chunkSize) {
        const chunk = dbStudents.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('students')
          .upsert(chunk, { 
            onConflict: 'id',
            ignoreDuplicates: false // Forçar atualização mesmo que os dados sejam iguais
          });
        
        if (error) {
          console.error("Erro ao salvar lote de estudantes:", error);
          
          if (error.code === "42501") {
            console.warn("Erro de permissão no banco de dados, tentando método alternativo");
            
            // Tentar salvar um a um
            for (const student of chunk) {
              const { error: singleError } = await supabase
                .from('students')
                .upsert(student, { onConflict: 'id' });
                
              if (singleError && singleError.code !== "42501") {
                console.error(`Erro ao salvar estudante ${student.id}:`, singleError);
                throw singleError;
              }
            }
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log("Salvamento forçado concluído com sucesso");
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
    
    if (error) {
      // Código de erro específico para violação de políticas RLS
      if (error.code === "42501") {
        toast.error("Erro de permissão no banco de dados", {
          description: "Contate o administrador para configurar as políticas de acesso."
        });
        return [];
      }
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Converter para o formato da aplicação
    const students = data.map(convertFromDbFormat);
    
    // Obter o histórico de status para cada estudante
    for (const student of students) {
      try {
        const { data: historyData, error: historyError } = await supabase
          .from('status_history')
          .select('*')
          .eq('student_id', student.id);
        
        if (historyError) {
          console.error("Erro ao obter histórico de status:", historyError);
          continue; // Continua com o próximo estudante mesmo se houver erro
        }
        
        if (historyData && historyData.length > 0) {
          student.statusHistory = historyData.map(history => ({
            oldStatus: history.old_status as Status,
            newStatus: history.new_status as Status,
            changedBy: history.changed_by,
            changedAt: new Date(history.changed_at)
          }));
        }
      } catch (innerError) {
        console.error("Erro ao processar histórico:", innerError);
      }
    }
    
    return students;
  } catch (error) {
    console.error("Erro ao obter estudantes:", error);
    toast.error("Erro ao carregar dados do banco de dados", {
      description: "Verifique sua conexão e tente novamente."
    });
    return [];
  }
};

// Verificar se existem dados para um mês específico
export const checkMonthData = async (mes: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('count', { count: 'exact' })
      .eq('mes', mes);
    
    if (error) {
      if (error.code === "42501") {
        // Erro de permissão é comum no início, não mostrar toast
        console.warn("Permissão insuficiente para verificar dados do mês:", error);
        return false;
      }
      throw error;
    }
    
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
  console.log(`Atualizando status do aluno ${studentId}: ${oldStatus} -> ${newStatus}`);
  
  try {
    // Primeiro precisamos obter todos os dados do estudante para fazer update/upsert corretamente
    const { data: studentData, error: fetchError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
    
    if (fetchError) {
      console.error("Erro ao buscar dados do estudante:", fetchError);
      
      // Se for erro de não encontrar o estudante, mostrar mensagem específica
      if (fetchError.code === "PGRST116") {
        toast.error("Estudante não encontrado no banco de dados", {
          description: "Tente recarregar a página ou verificar se o aluno foi excluído."
        });
        return;
      }
      
      throw fetchError;
    }
    
    if (!studentData) {
      console.error(`Estudante com ID ${studentId} não encontrado`);
      toast.error("Erro ao atualizar status: estudante não encontrado");
      return;
    }
    
    console.log("Dados do estudante recuperados:", studentData);
    
    // Atualizar apenas o campo status
    const { error: updateError } = await supabase
      .from('students')
      .update({ 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', studentId);
    
    if (updateError) {
      console.error("Erro ao atualizar status:", updateError);
      
      if (updateError.code === "42501") {
        console.warn("Erro de permissão ao atualizar status, tentando método alternativo");
        
        // Atualizar todos os campos necessários do estudante no upsert
        const updatedStudent = {
          ...studentData,
          status: newStatus,
          updated_at: new Date().toISOString()
        };
        
        console.log("Tentando upsert com dados completos:", updatedStudent);
        
        const { error: upsertError } = await supabase
          .from('students')
          .upsert(updatedStudent, { onConflict: 'id' });
          
        if (upsertError) {
          console.error("Erro ao usar upsert para status:", upsertError);
          toast.error("Erro de permissão ao atualizar status", {
            description: "Contate o administrador para configurar as políticas de acesso."
          });
          throw upsertError;
        } else {
          console.log(`Status atualizado com sucesso via upsert: ${studentId}`);
        }
      } else {
        throw updateError;
      }
    } else {
      console.log(`Status atualizado com sucesso: ${studentId}`);
    }
    
    // Adicionar ao histórico
    try {
      console.log(`Adicionando ao histórico: ${studentId} ${oldStatus} -> ${newStatus}`);
      
      const { error: historyError } = await supabase
        .from('status_history')
        .insert({
          student_id: studentId,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: changedBy,
          changed_at: new Date().toISOString()
        });
      
      if (historyError) {
        if (historyError.code === "42501") {
          console.warn("Erro de permissão ao adicionar histórico:", historyError);
          // Não interrompe o fluxo pois a atualização principal já foi feita
        } else {
          console.error("Erro ao adicionar histórico:", historyError);
        }
      } else {
        console.log(`Histórico adicionado com sucesso: ${studentId}`);
      }
    } catch (historyError) {
      console.error("Erro ao adicionar histórico:", historyError);
    }
    
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    toast.error("Erro ao atualizar status do aluno", {
      description: "Verifique sua conexão e tente novamente."
    });
    throw error;
  }
};
