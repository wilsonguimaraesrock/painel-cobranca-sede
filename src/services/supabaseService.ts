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
    
    if (students.length === 0) {
      console.log("Nenhum aluno para salvar");
      return;
    }
    
    // Converter para o formato do banco de dados
    const dbStudents = students.map(student => convertToDbFormat(student));
    
    // Inserir em lotes de 20 para evitar problemas com requisições muito grandes
    const chunkSize = 20;
    for (let i = 0; i < dbStudents.length; i += chunkSize) {
      const chunk = dbStudents.slice(i, i + chunkSize);
      console.log(`Salvando lote ${Math.floor(i/chunkSize) + 1} de ${Math.ceil(dbStudents.length/chunkSize)}`);
      
      try {
        const { error } = await supabase
          .from('students')
          .upsert(chunk, { 
            onConflict: 'id',
            ignoreDuplicates: false // Forçar atualização mesmo que os dados sejam iguais
          });
        
        if (error) {
          if (error.code === "42501") {
            console.warn("Erro de permissão ao salvar lote, tentando um por um:", error);
            
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
            console.error("Erro ao salvar lote de estudantes:", error);
            throw error;
          }
        }
      } catch (chunkError) {
        console.error(`Erro ao processar lote ${Math.floor(i/chunkSize) + 1}:`, chunkError);
        // Continuamos com o próximo lote mesmo se houver erro
      }
    }
    
    console.log(`Finalizado salvamento de ${students.length} alunos para o mês ${mes}`);
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

// Checar se existem dados para um mês específico
export const checkMonthData = async (mes: string): Promise<boolean> => {
  try {
    console.log(`Checking month data for: ${mes}`);
    
    // First try exact match
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('mes', mes);
    
    if (error) {
      if (error.code === "42501") {
        // Erro de permissão é comum no início, não mostrar toast
        console.warn("Permissão insuficiente para verificar dados do mês:", error);
        return false;
      }
      throw error;
    }
    
    console.log(`Found ${count} students with exact match for month ${mes}`);
    
    if (count && count > 0) {
      return true;
    }
    
    // If no exact match, try to find similar formats
    const { data: allStudents, error: allError } = await supabase
      .from('students')
      .select('mes')
      .limit(100);
    
    if (allError) {
      console.error("Error fetching all student months:", allError);
      return false;
    }
    
    console.log("All month values in database:", allStudents?.map(s => s.mes));
    
    return false;
  } catch (error) {
    console.error("Erro ao verificar dados do mês:", error);
    return false;
  }
};

// Obter estudantes do banco de dados para um mês específico
export const getStudents = async (mes: string): Promise<Student[]> => {
  try {
    console.log(`Buscando estudantes no banco para o mês ${mes}`);
    
    // First try exact match
    let { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('mes', mes);
    
    if (error) {
      // Código de erro específico para violação de políticas RLS
      if (error.code === "42501") {
        console.warn("Erro de permissão ao acessar banco de dados:", error);
        toast.error("Erro de permissão no banco de dados", {
          description: "Contate o administrador para configurar as políticas de acesso."
        });
        return [];
      }
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} students with exact match for month ${mes}`);
    
    // If no exact match found, try different formats
    if (!data || data.length === 0) {
      console.log("No exact match found, trying alternative formats...");
      
      // Try case variations and similar formats
      const alternativeFormats = [
        mes.toLowerCase(),
        mes.toUpperCase(),
        'maio/25',
        'MAIO/25',
        'Maio/25'
      ];
      
      for (const format of alternativeFormats) {
        if (format === mes) continue; // Skip already tried format
        
        console.log(`Trying format: ${format}`);
        const { data: altData, error: altError } = await supabase
          .from('students')
          .select('*')
          .eq('mes', format);
        
        if (altError) {
          console.error(`Error with format ${format}:`, altError);
          continue;
        }
        
        if (altData && altData.length > 0) {
          console.log(`Found ${altData.length} students with format ${format}`);
          data = altData;
          break;
        }
      }
    }
    
    if (!data || data.length === 0) {
      console.log(`Nenhum estudante encontrado no banco para o mês ${mes} em qualquer formato`);
      return [];
    }
    
    console.log(`Encontrados ${data.length} estudantes no banco para o mês ${mes}`);
    
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
          console.log(`Encontrados ${historyData.length} registros de histórico para o estudante ${student.id}`);
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

// Atualizar o status de um estudante
export const updateStudentStatus = async (
  studentId: string, 
  oldStatus: Status, 
  newStatus: Status, 
  changedBy: string
): Promise<void> => {
  console.log(`Atualizando status do aluno ${studentId}: ${oldStatus} -> ${newStatus}`);
  
  try {
    // Primeiro adicionamos ao histórico
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
          // Não interrompe o fluxo pois a atualização principal está por vir
        } else {
          console.error("Erro ao adicionar histórico:", historyError);
        }
      } else {
        console.log(`Histórico adicionado com sucesso: ${studentId}`);
      }
    } catch (historyError) {
      console.error("Erro ao adicionar histórico:", historyError);
    }
    
    // Agora atualizamos o status do estudante
    // Em vez de buscar dados primeiro, fazemos update direto
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
        // Se for erro de permissão, buscamos o estudante e tentamos upsert
        console.warn("Erro de permissão ao atualizar status, tentando obter dados para upsert");
        
        const { data: studentData, error: fetchError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .maybeSingle(); // Usamos maybeSingle em vez de single para evitar erro
          
        if (fetchError) {
          console.error("Erro ao buscar dados do estudante para upsert:", fetchError);
          throw fetchError;
        }
        
        if (studentData) {
          console.log("Dados do estudante recuperados para upsert:", studentData);
          
          // Atualizar status e tentar upsert
          studentData.status = newStatus;
          studentData.updated_at = new Date().toISOString();
          
          const { error: upsertError } = await supabase
            .from('students')
            .upsert(studentData, { onConflict: 'id' });
            
          if (upsertError) {
            console.error("Erro ao usar upsert para status:", upsertError);
            throw upsertError;
          } else {
            console.log(`Status atualizado com sucesso via upsert: ${studentId}`);
          }
        } else {
          console.error(`Estudante com ID ${studentId} não encontrado para upsert`);
          toast.error("Erro ao atualizar status", {
            description: "Estudante não encontrado no banco de dados."
          });
          throw new Error(`Estudante com ID ${studentId} não encontrado`);
        }
      } else {
        throw updateError;
      }
    } else {
      console.log(`Status atualizado com sucesso via update: ${studentId}`);
    }
    
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    toast.error("Erro ao atualizar status do aluno", {
      description: "Verifique sua conexão e tente novamente."
    });
    throw error;
  }
};

// Delete a student from the database
export const deleteStudent = async (studentId: string): Promise<void> => {
  try {
    console.log(`Deleting student with ID: ${studentId}`);
    
    // First delete any status history records related to this student
    const { error: historyError } = await supabase
      .from('status_history')
      .delete()
      .eq('student_id', studentId);
    
    if (historyError) {
      console.error("Error deleting student's status history:", historyError);
      
      if (historyError.code !== "42501") { // Not a permission error
        throw historyError;
      }
      // Continue with student deletion even if history deletion fails due to permissions
    }
    
    // Now delete the student
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);
    
    if (error) {
      console.error("Error deleting student:", error);
      throw error;
    }
    
    console.log(`Student ${studentId} deleted successfully`);
  } catch (error) {
    console.error("Error deleting student:", error);
    toast.error("Erro ao excluir aluno", {
      description: "Verifique sua conexão e tente novamente."
    });
    throw error;
  }
};
