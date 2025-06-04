import { supabase, supabaseUtils } from "@/config/supabase";
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

// Adicionar função para verificar conexão com o Supabase
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log("Verificando conexão com o Supabase...");
    const { data, error } = await supabase.from('students').select('count').limit(1);
    
    if (error) {
      console.error("Erro na conexão com o Supabase:", error);
      toast.error("Erro de conexão com o banco de dados", {
        description: "Verifique sua conexão e tente novamente."
      });
      return false;
    }
    
    console.log("Conexão com o Supabase estabelecida com sucesso");
    return true;
  } catch (error) {
    console.error("Erro ao verificar conexão com o Supabase:", error);
    toast.error("Erro ao verificar conexão com o banco de dados");
    return false;
  }
};

// Modificar a função saveStudents para usar o novo tratamento de erros
export const saveStudents = async (students: Student[], mes: string): Promise<void> => {
  try {
    console.log(`Iniciando salvamento de ${students.length} alunos para o mês ${mes}`);
    
    // Verificar conexão antes de prosseguir
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      throw new Error("Sem conexão com o banco de dados");
    }
    
    if (students.length === 0) {
      console.log("Nenhum aluno para salvar");
      return;
    }
    
    // Converter para o formato do banco de dados
    const dbStudents = students.map(student => convertToDbFormat(student));
    
    // Inserir em lotes de 20 para evitar problemas com requisições muito grandes
    const chunkSize = 20;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < dbStudents.length; i += chunkSize) {
      const chunk = dbStudents.slice(i, i + chunkSize);
      console.log(`Salvando lote ${Math.floor(i/chunkSize) + 1} de ${Math.ceil(dbStudents.length/chunkSize)}`);
      
      try {
        const { error } = await supabase
          .from('students')
          .upsert(chunk, { 
            onConflict: 'id',
            ignoreDuplicates: false
          });
        
        if (error) {
          console.error(`Erro ao salvar lote ${Math.floor(i/chunkSize) + 1}:`, error);
          errorCount += chunk.length;
          
          const errorInfo = supabaseUtils.handleError(error);
          toast.error(errorInfo.message, {
            description: errorInfo.description
          });
          
          if (supabaseUtils.isPermissionError(error)) {
            console.warn("Erro de permissão ao salvar lote, tentando um por um");
            
            // Tentar salvar um a um
            for (const student of chunk) {
              const { error: singleError } = await supabase
                .from('students')
                .upsert(student, { onConflict: 'id' });
                
              if (singleError) {
                console.error(`Erro ao salvar estudante ${student.id}:`, singleError);
                errorCount++;
              } else {
                successCount++;
              }
            }
          }
        } else {
          successCount += chunk.length;
        }
      } catch (chunkError) {
        console.error(`Erro ao processar lote ${Math.floor(i/chunkSize) + 1}:`, chunkError);
        errorCount += chunk.length;
        
        const errorInfo = supabaseUtils.handleError(chunkError);
        toast.error(errorInfo.message, {
          description: errorInfo.description
        });
      }
    }
    
    console.log(`Finalizado salvamento: ${successCount} sucessos, ${errorCount} erros`);
    
    if (errorCount > 0) {
      toast.warning(`Alguns dados não foram salvos (${errorCount} erros)`);
    } else {
      toast.success("Dados salvos com sucesso");
    }
  } catch (error) {
    console.error("Erro ao salvar estudantes:", error);
    const errorInfo = supabaseUtils.handleError(error);
    toast.error(errorInfo.message, {
      description: errorInfo.description
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
    
    // Se não encontrou com formato atual, tentar formatos antigos
    const legacyFormats = [
      'MAIO',      // Formato antigo
      'maio',      // Minúsculo
      'Maio',      // Capitalizado
    ];
    
    for (const format of legacyFormats) {
      const { count: legacyCount, error: legacyError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('mes', format);
      
      if (legacyError) {
        console.error(`Error checking legacy format ${format}:`, legacyError);
        continue;
      }
      
      if (legacyCount && legacyCount > 0) {
        console.log(`Found ${legacyCount} students with legacy format ${format}`);
        return true;
      }
    }
    
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
    
    // Se não encontrou com formato atual, tentar formatos antigos
    if (!data || data.length === 0) {
      console.log("No exact match found, trying legacy formats...");
      
      const legacyFormats = [
        'MAIO',      // Formato antigo principal
        'maio',      // Minúsculo
        'Maio',      // Capitalizado
        'maio/25',   // Com ano
        'MAIO/25',   // Com ano maiúsculo
      ];
      
      for (const format of legacyFormats) {
        if (format === mes) continue; // Skip already tried format
        
        console.log(`Trying legacy format: ${format}`);
        const { data: legacyData, error: legacyError } = await supabase
          .from('students')
          .select('*')
          .eq('mes', format);
        
        if (legacyError) {
          console.error(`Error with legacy format ${format}:`, legacyError);
          continue;
        }
        
        if (legacyData && legacyData.length > 0) {
          console.log(`Found ${legacyData.length} students with legacy format ${format}`);
          data = legacyData;
          
          // Atualizar o formato do mês nos dados encontrados para o formato atual
          console.log(`Updating month format from ${format} to ${mes} for ${data.length} students`);
          
          try {
            const updatePromises = data.map(student => 
              supabase
                .from('students')
                .update({ mes: mes })
                .eq('id', student.id)
            );
            
            await Promise.all(updatePromises);
            console.log(`Successfully updated month format for all ${data.length} students`);
            
            // Atualizar os dados locais também
            data = data.map(student => ({ ...student, mes: mes }));
            
            toast.success(`Dados recuperados e atualizados`, {
              description: `${data.length} estudantes encontrados com formato antigo "${format}" e atualizados para "${mes}"`
            });
          } catch (updateError) {
            console.error("Erro ao atualizar formato do mês:", updateError);
            // Continuar mesmo se a atualização falhar
            toast.info(`Dados recuperados`, {
              description: `${data.length} estudantes encontrados com formato "${format}"`
            });
          }
          
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
