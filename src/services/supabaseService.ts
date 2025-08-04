import { supabase, supabaseUtils } from "@/config/supabase";
import { Student, Status, StatusHistory, FollowUp } from "@/types";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { filterStudentsForMonth } from "./vencimentoService";

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
    data_pagamento: student.dataPagamento || "",
    mes: student.mes,
    created_by: student.createdBy || ""
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
    dataPagamento: dbStudent.data_pagamento || "",
    mes: dbStudent.mes,
    createdBy: dbStudent.created_by || "",
    statusHistory: [], // Inicializa o histórico vazio para ser preenchido depois
    followUps: [] // Inicializa follow-ups vazio - será carregado separadamente
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

// Preservar status existente dos alunos ao importar da planilha
export const preserveExistingStatus = async (newStudents: Student[], mes: string): Promise<Student[]> => {
  try {
    console.log(`Preservando status existente para ${newStudents.length} alunos do mês ${mes}`);
    
    // Buscar alunos existentes no banco para este mês
    const existingStudents = await getStudents(mes);
    
    // Mapear alunos existentes por nome para facilitar busca
    const existingStudentsMap = new Map<string, Student>();
    existingStudents.forEach(student => {
      existingStudentsMap.set(student.nome.toLowerCase().trim(), student);
    });
    
    // Preservar status existente ou usar "inadimplente" para novos
    const studentsWithPreservedStatus = newStudents.map(newStudent => {
      const existingStudent = existingStudentsMap.get(newStudent.nome.toLowerCase().trim());
      
      if (existingStudent) {
        console.log(`✅ Preservando status "${existingStudent.status}" para aluno ${newStudent.nome}`);
        return {
          ...newStudent,
          status: existingStudent.status,
          statusHistory: existingStudent.statusHistory || [],
          followUps: existingStudent.followUps || []
        };
      } else {
        console.log(`🆕 Novo aluno ${newStudent.nome} - status definido como "inadimplente"`);
        return {
          ...newStudent,
          status: "inadimplente" as Status,
          statusHistory: [],
          followUps: []
        };
      }
    });
    
    console.log(`Status preservado para ${studentsWithPreservedStatus.length} alunos`);
    return studentsWithPreservedStatus;
    
  } catch (error) {
    console.error("Erro ao preservar status existente:", error);
    // Em caso de erro, retornar alunos com status "inadimplente" (comportamento original)
    return newStudents.map(student => ({
      ...student,
      status: "inadimplente" as Status,
      statusHistory: [],
      followUps: []
    }));
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
    
    // First try exact match (case-insensitive)
    let { data, error } = await supabase
      .from('students')
      .select('*')
      .ilike('mes', mes);
    
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
          .ilike('mes', format);
        
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
    
    // Obter o histórico de status e follow-ups para cada estudante
    for (const student of students) {
      try {
        // Carregar histórico de status
        const { data: historyData, error: historyError } = await supabase
          .from('status_history')
          .select('*')
          .eq('student_id', student.id);
        
        if (historyError) {
          console.error("Erro ao obter histórico de status:", historyError);
        } else if (historyData && historyData.length > 0) {
          console.log(`Encontrados ${historyData.length} registros de histórico para o estudante ${student.id}`);
          student.statusHistory = historyData.map(history => ({
            oldStatus: history.old_status as Status,
            newStatus: history.new_status as Status,
            changedBy: history.changed_by,
            changedAt: new Date(history.changed_at)
          }));
        }

        // Carregar follow-ups
        const { data: followUpsData, error: followUpsError } = await supabase
          .from('follow_ups')
          .select('*')
          .eq('student_id', student.id)
          .order('created_at', { ascending: true });
        
        if (followUpsError) {
          console.error("Erro ao obter follow-ups:", followUpsError);
        } else if (followUpsData && followUpsData.length > 0) {
          console.log(`Encontrados ${followUpsData.length} follow-ups para o estudante ${student.id}`);
          student.followUps = followUpsData.map((dbFollowUp: any) => ({
            id: dbFollowUp.id,
            studentId: dbFollowUp.student_id,
            content: dbFollowUp.content,
            createdBy: dbFollowUp.created_by,
            createdAt: new Date(dbFollowUp.created_at),
            updatedAt: new Date(dbFollowUp.updated_at)
          }));
        } else {
          student.followUps = []; // Inicializar array vazio se não há follow-ups
        }
      } catch (innerError) {
        console.error("Erro ao processar dados do estudante:", innerError);
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

// Buscar todos os alunos e aplicar filtro de vencimento
export const getStudentsWithVencimentoFilter = async (targetMonth: string): Promise<Student[]> => {
  try {
    console.log(`Buscando todos os estudantes e aplicando filtro de vencimento para o mês ${targetMonth}`);
    
    // Buscar todos os estudantes do banco
    const { data, error } = await supabase
      .from('students')
      .select('*');
    
    if (error) {
      console.error("Erro ao buscar todos os estudantes:", error);
      toast.error("Erro ao carregar dados do banco de dados", {
        description: "Verifique sua conexão e tente novamente."
      });
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log("Nenhum estudante encontrado no banco");
      return [];
    }
    
    console.log(`Encontrados ${data.length} estudantes no banco total`);
    
    // Converter para o formato da aplicação
    const allStudents = data.map(convertFromDbFormat);
    
    // Obter o histórico de status e follow-ups para cada estudante
    for (const student of allStudents) {
      try {
        // Carregar histórico de status
        const { data: statusHistoryData, error: statusError } = await supabase
          .from('status_history')
          .select('*')
          .eq('student_id', student.id)
          .order('changed_at', { ascending: true });
        
        if (statusError) {
          console.error(`Erro ao carregar histórico de status para ${student.id}:`, statusError);
          student.statusHistory = [];
        } else if (statusHistoryData && statusHistoryData.length > 0) {
          student.statusHistory = statusHistoryData.map((dbHistory: any) => ({
            id: dbHistory.id,
            studentId: dbHistory.student_id,
            oldStatus: dbHistory.old_status as Status,
            newStatus: dbHistory.new_status as Status,
            changedBy: dbHistory.changed_by,
            changedAt: new Date(dbHistory.changed_at)
          }));
        } else {
          student.statusHistory = [];
        }
        
        // Carregar follow-ups
        const { data: followUpsData, error: followUpsError } = await supabase
          .from('follow_ups')
          .select('*')
          .eq('student_id', student.id)
          .order('created_at', { ascending: true });
        
        if (followUpsError) {
          console.error(`Erro ao carregar follow-ups para ${student.id}:`, followUpsError);
          student.followUps = [];
        } else if (followUpsData && followUpsData.length > 0) {
          student.followUps = followUpsData.map((dbFollowUp: any) => ({
            id: dbFollowUp.id,
            studentId: dbFollowUp.student_id,
            content: dbFollowUp.content,
            createdBy: dbFollowUp.created_by,
            createdAt: new Date(dbFollowUp.created_at),
            updatedAt: new Date(dbFollowUp.updated_at)
          }));
        } else {
          student.followUps = [];
        }
      } catch (innerError) {
        console.error("Erro ao processar dados do estudante:", innerError);
      }
    }
    
    // Aplicar filtro de vencimento
    const filteredStudents = filterStudentsForMonth(allStudents, targetMonth);
    
    console.log(`Filtro de vencimento aplicado: ${allStudents.length} total -> ${filteredStudents.length} para o mês ${targetMonth}`);
    
    return filteredStudents;
  } catch (error) {
    console.error("Erro ao obter estudantes com filtro de vencimento:", error);
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
    // Preparar os dados para atualização
    const updateData: any = { 
      status: newStatus, 
      updated_at: new Date().toISOString() 
    };
    
    // Se o status for "pagamento-feito", calcular e fixar os dias em atraso até a data atual
    if (newStatus === "pagamento-feito") {
      // Buscar os dados atuais do estudante para calcular os dias em atraso finais
      const { data: currentStudent, error: fetchError } = await supabase
        .from('students')
        .select('data_vencimento, dias_atraso')
        .eq('id', studentId)
        .maybeSingle();
        
      if (!fetchError && currentStudent && currentStudent.data_vencimento) {
        try {
          // Calcular dias em atraso até hoje (que será o valor final)
          const parts = currentStudent.data_vencimento.split('/');
          if (parts.length === 3) {
            const vencimentoDate = new Date(
              parseInt(parts[2]), 
              parseInt(parts[1]) - 1, 
              parseInt(parts[0])
            );
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const diffTime = today.getTime() - vencimentoDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Fixar os dias em atraso no valor atual (não será mais recalculado)
            updateData.dias_atraso = diffDays > 0 ? diffDays : 0;
          }
        } catch (error) {
          console.error("Erro ao calcular dias em atraso finais:", error);
        }
      }
    }
    
    // Em vez de buscar dados primeiro, fazemos update direto
    const { error: updateError } = await supabase
      .from('students')
      .update(updateData)
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

// ========== FOLLOW-UPS FUNCTIONS ==========

// Buscar follow-ups de um estudante específico
export const getFollowUps = async (studentId: string): Promise<FollowUp[]> => {
  try {
    console.log(`Buscando follow-ups para o estudante ${studentId}`);
    
    const { data, error } = await supabase
      .from('follow_ups' as any)
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true }); // Do mais antigo para o mais novo
    
    if (error) {
      console.error("Erro ao buscar follow-ups:", error);
      throw error;
    }
    
    // Converter formato do banco para o formato da aplicação
    const followUps: FollowUp[] = data?.map((dbFollowUp: any) => ({
      id: dbFollowUp.id,
      studentId: dbFollowUp.student_id,
      content: dbFollowUp.content,
      createdBy: dbFollowUp.created_by,
      createdAt: new Date(dbFollowUp.created_at),
      updatedAt: new Date(dbFollowUp.updated_at)
    })) || [];
    
    console.log(`Found ${followUps.length} follow-ups for student ${studentId}`);
    return followUps;
    
  } catch (error) {
    console.error("Erro ao buscar follow-ups:", error);
    toast.error("Erro ao carregar follow-ups", {
      description: "Verifique sua conexão e tente novamente."
    });
    return [];
  }
};

// Adicionar um novo follow-up
export const addFollowUp = async (studentId: string, content: string, createdBy: string): Promise<FollowUp | null> => {
  try {
    console.log(`Adicionando follow-up para o estudante ${studentId}`);
    
    const { data, error } = await supabase
      .from('follow_ups' as any)
      .insert({
        student_id: studentId,
        content: content.trim(),
        created_by: createdBy
      })
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao adicionar follow-up:", error);
      throw error;
    }
    
    // Converter formato do banco para o formato da aplicação
    const followUp: FollowUp = {
      id: data.id,
      studentId: data.student_id,
      content: data.content,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
    
    console.log(`Follow-up adicionado com sucesso: ${followUp.id}`);
    toast.success("Follow-up adicionado com sucesso!");
    
    return followUp;
    
  } catch (error) {
    console.error("Erro ao adicionar follow-up:", error);
    toast.error("Erro ao adicionar follow-up", {
      description: "Verifique sua conexão e tente novamente."
    });
    return null;
  }
};

// Atualizar um follow-up existente (apenas quem criou pode editar)
export const updateFollowUp = async (followUpId: string, content: string, currentUser: string): Promise<boolean> => {
  try {
    console.log(`Atualizando follow-up ${followUpId}`);
    
    // Primeiro verificar se o usuário atual é o criador
    const { data: existingFollowUp, error: fetchError } = await supabase
      .from('follow_ups' as any)
      .select('created_by')
      .eq('id', followUpId)
      .single();
    
    if (fetchError) {
      console.error("Erro ao buscar follow-up:", fetchError);
      throw fetchError;
    }
    
    if (existingFollowUp.created_by !== currentUser) {
      toast.error("Permissão negada", {
        description: "Apenas quem criou o follow-up pode editá-lo."
      });
      return false;
    }
    
    const { error } = await supabase
      .from('follow_ups' as any)
      .update({ 
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', followUpId);
    
    if (error) {
      console.error("Erro ao atualizar follow-up:", error);
      throw error;
    }
    
    console.log(`Follow-up ${followUpId} atualizado com sucesso`);
    toast.success("Follow-up atualizado com sucesso!");
    
    return true;
    
  } catch (error) {
    console.error("Erro ao atualizar follow-up:", error);
    toast.error("Erro ao atualizar follow-up", {
      description: "Verifique sua conexão e tente novamente."
    });
    return false;
  }
};

// Excluir um follow-up (apenas quem criou pode excluir)
export const deleteFollowUp = async (followUpId: string, currentUser: string): Promise<boolean> => {
  try {
    console.log(`Excluindo follow-up ${followUpId}`);
    
    // Primeiro verificar se o usuário atual é o criador
    const { data: existingFollowUp, error: fetchError } = await supabase
      .from('follow_ups' as any)
      .select('created_by')
      .eq('id', followUpId)
      .single();
    
    if (fetchError) {
      console.error("Erro ao buscar follow-up:", fetchError);
      throw fetchError;
    }
    
    if (existingFollowUp.created_by !== currentUser) {
      toast.error("Permissão negada", {
        description: "Apenas quem criou o follow-up pode excluí-lo."
      });
      return false;
    }
    
    const { error } = await supabase
      .from('follow_ups' as any)
      .delete()
      .eq('id', followUpId);
    
    if (error) {
      console.error("Erro ao excluir follow-up:", error);
      throw error;
    }
    
    console.log(`Follow-up ${followUpId} excluído com sucesso`);
    toast.success("Follow-up excluído com sucesso!");
    
    return true;
    
  } catch (error) {
    console.error("Erro ao excluir follow-up:", error);
    toast.error("Erro ao excluir follow-up", {
      description: "Verifique sua conexão e tente novamente."
    });
    return false;
  }
};

// Verificar e corrigir follow-ups de alunos migrados
export const checkAndFixMigratedStudentFollowUps = async (studentId: string): Promise<boolean> => {
  try {
    console.log(`🔍 Verificando follow-ups para aluno ${studentId}`);
    
    // Buscar follow-ups do aluno
    const { data: followUps, error } = await supabase
      .from('follow_ups')
      .select('*')
      .eq('student_id', studentId);
    
    if (error) {
      console.error(`❌ Erro ao buscar follow-ups:`, error);
      return false;
    }
    
    console.log(`📋 Follow-ups encontrados: ${followUps?.length || 0}`);
    
    // Se não há follow-ups, tentar buscar por nome do aluno
    if (!followUps || followUps.length === 0) {
      console.log(`🔍 Buscando aluno por ID para obter nome...`);
      
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('nome, mes')
        .eq('id', studentId)
        .single();
      
      if (studentError || !student) {
        console.error(`❌ Erro ao buscar aluno:`, studentError);
        return false;
      }
      
      console.log(`🔍 Aluno encontrado: ${student.nome} (mês: ${student.mes})`);
      
      // Buscar alunos com mesmo nome em outros meses
      const { data: similarStudents, error: similarError } = await supabase
        .from('students')
        .select('id, nome, mes')
        .ilike('nome', student.nome)
        .neq('id', studentId);
      
      if (similarError) {
        console.error(`❌ Erro ao buscar alunos similares:`, similarError);
        return false;
      }
      
      console.log(`🔍 Alunos similares encontrados: ${similarStudents?.length || 0}`);
      
      // Buscar follow-ups dos alunos similares
      for (const similarStudent of similarStudents || []) {
        console.log(`🔍 Verificando follow-ups de ${similarStudent.nome} (${similarStudent.mes})`);
        
        const { data: similarFollowUps, error: similarFollowUpsError } = await supabase
          .from('follow_ups')
          .select('*')
          .eq('student_id', similarStudent.id);
        
        if (similarFollowUpsError) {
          console.error(`❌ Erro ao buscar follow-ups similares:`, similarFollowUpsError);
          continue;
        }
        
        if (similarFollowUps && similarFollowUps.length > 0) {
          console.log(`✅ Encontrados ${similarFollowUps.length} follow-ups para copiar`);
          
          // Copiar follow-ups para o aluno atual
          const newFollowUps = similarFollowUps.map(fu => ({
            id: uuidv4(),
            student_id: studentId,
            content: fu.content,
            created_by: fu.created_by,
            created_at: fu.created_at,
            updated_at: fu.updated_at
          }));
          
          const { error: insertError } = await supabase
            .from('follow_ups')
            .insert(newFollowUps);
          
          if (insertError) {
            console.error(`❌ Erro ao inserir follow-ups copiados:`, insertError);
          } else {
            console.log(`✅ ${newFollowUps.length} follow-ups copiados com sucesso`);
            return true;
          }
        }
      }
    } else {
      console.log(`✅ Aluno já tem ${followUps.length} follow-ups`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erro geral ao verificar follow-ups:`, error);
    return false;
  }
};
