
import { useState, useEffect } from "react";
import { Student, Status } from "@/types";
import StudentCard from "./StudentCard";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { updateStudentStatus } from "@/services/supabaseService";

interface KanbanBoardProps {
  students: Student[];
  onStudentUpdate: (updatedStudent: Student) => void;
  filteredStudents?: Student[];
  isFiltered: boolean;
}

const KanbanBoard = ({ students, onStudentUpdate, filteredStudents, isFiltered }: KanbanBoardProps) => {
  const { username } = useAuth();
  const [processingStudentId, setProcessingStudentId] = useState<string | null>(null);
  const [localStudents, setLocalStudents] = useState<Student[]>([]);
  
  // Sincronizar o estado local com as props
  useEffect(() => {
    const studentsToShow = isFiltered && filteredStudents ? filteredStudents : students;
    setLocalStudents(studentsToShow);
  }, [students, filteredStudents, isFiltered]);
  
  // Usar os estudantes locais para exibição
  const studentsToShow = localStudents;
  
  // Definição das colunas do Kanban
  const columns: { id: Status; title: string; color: string }[] = [
    { id: "inadimplente", title: "Alunos Inadimplentes", color: "bg-kanban-overdue" },
    { id: "mensagem-enviada", title: "Mensagem Enviada", color: "bg-kanban-sent" },
    { id: "resposta-recebida", title: "Resposta Recebida", color: "bg-kanban-replied" },
    { id: "pagamento-feito", title: "Pagamento Realizado", color: "bg-kanban-paid" }
  ];

  // Mapeamento do status para o status anterior
  const previousStatusMap: Record<Status, Status> = {
    "inadimplente": "inadimplente", // Primeiro status, não tem anterior
    "mensagem-enviada": "inadimplente",
    "resposta-recebida": "mensagem-enviada",
    "pagamento-feito": "resposta-recebida"
  };

  // Agrupar estudantes por status
  const studentsByStatus: Record<Status, Student[]> = {
    "inadimplente": [],
    "mensagem-enviada": [],
    "resposta-recebida": [],
    "pagamento-feito": []
  };

  studentsToShow.forEach(student => {
    studentsByStatus[student.status].push(student);
  });

  // Função para atualizar o estado local
  const updateLocalStudent = (updatedStudent: Student) => {
    setLocalStudents(prev => 
      prev.map(student => 
        student.id === updatedStudent.id ? updatedStudent : student
      )
    );
  };

  // Função para alterar o status de um aluno para o próximo
  const handleStatusChange = async (studentId: string, newStatus: Status) => {
    console.log(`handleStatusChange chamado para aluno ${studentId}, novo status: ${newStatus}`);
    
    // Evitar múltiplas chamadas simultâneas para o mesmo estudante
    if (processingStudentId === studentId) {
      console.log(`Aluno ${studentId} já está sendo processado, ignorando`);
      return;
    }
    
    setProcessingStudentId(studentId);
    
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
      console.log(`Aluno ${studentId} não encontrado`);
      setProcessingStudentId(null);
      return;
    }
    
    // Verificar se o campo follow up está preenchido
    if (student.followUp.trim() === "" && student.status !== "pagamento-feito") {
      toast.error("O campo 'Follow Up' precisa ser preenchido para mover o aluno", {
        description: "Atualize o campo na planilha e tente novamente."
      });
      setProcessingStudentId(null);
      return;
    }
    
    try {
      // Salvar o status antigo para o histórico
      const oldStatus = student.status;
      
      // Adicionar entrada ao histórico localmente primeiro
      const statusHistory = student.statusHistory || [];
      const historyEntry = {
        oldStatus: student.status,
        newStatus: newStatus,
        changedBy: username || 'Usuário não identificado',
        changedAt: new Date()
      };
      
      // Atualizar o status local imediatamente para feedback imediato ao usuário
      const updatedStudent = { 
        ...student, 
        status: newStatus,
        statusHistory: [...statusHistory, historyEntry]
      };
      
      // Atualizar estado local primeiro para feedback imediato
      updateLocalStudent(updatedStudent);
      
      // Atualizar a UI do componente pai
      onStudentUpdate(updatedStudent);
      
      console.log(`Atualizando status no banco de dados para aluno ${studentId}`);
      
      // Agora atualizar no banco de dados
      await updateStudentStatus(
        studentId, 
        oldStatus, 
        newStatus, 
        username || 'Usuário não identificado'
      );
      
      // Mensagem de confirmação
      toast.success(`Aluno movido com sucesso`, {
        description: `${student.nome} foi movido para ${columns.find(c => c.id === newStatus)?.title}`
      });
      
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      
      // Reverter para o status anterior no caso de erro
      const originalStudent = students.find(s => s.id === studentId);
      if (originalStudent) {
        updateLocalStudent({...originalStudent});
        onStudentUpdate({...originalStudent});
      }
      
      toast.error("Erro ao mover o aluno", {
        description: "Verifique sua conexão e tente novamente."
      });
    } finally {
      setProcessingStudentId(null);
    }
  };

  // Função para retornar o aluno para o status anterior
  const handleReturnToPreviousStatus = async (studentId: string) => {
    console.log(`handleReturnToPreviousStatus chamado para aluno ${studentId}`);
    
    // Evitar múltiplas chamadas simultâneas para o mesmo estudante
    if (processingStudentId === studentId) {
      console.log(`Aluno ${studentId} já está sendo processado, ignorando`);
      return;
    }
    
    setProcessingStudentId(studentId);
    
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
      console.log(`Aluno ${studentId} não encontrado`);
      setProcessingStudentId(null);
      return;
    }
    
    // Se já está no primeiro status, não faz nada
    if (student.status === "inadimplente") {
      toast.info("Aluno já está no primeiro estágio", {
        description: "Não é possível retornar mais."
      });
      setProcessingStudentId(null);
      return;
    }
    
    try {
      // Obter o status anterior
      const previousStatus = previousStatusMap[student.status];
      
      // Adicionar entrada ao histórico localmente primeiro
      const statusHistory = student.statusHistory || [];
      const historyEntry = {
        oldStatus: student.status,
        newStatus: previousStatus,
        changedBy: username || 'Usuário não identificado',
        changedAt: new Date()
      };
      
      // Atualizar o status local imediatamente
      const updatedStudent = { 
        ...student, 
        status: previousStatus,
        statusHistory: [...statusHistory, historyEntry]
      };
      
      // Atualizar estado local primeiro para feedback imediato
      updateLocalStudent(updatedStudent);
      
      // Atualizar a UI do componente pai
      onStudentUpdate(updatedStudent);
      
      console.log(`Atualizando status no banco de dados para aluno ${studentId} (retorno)`);
      
      // Agora atualizar no banco de dados
      await updateStudentStatus(
        studentId, 
        student.status, 
        previousStatus, 
        username || 'Usuário não identificado'
      );
      
      // Mensagem de confirmação
      toast.success(`Aluno retornado com sucesso`, {
        description: `${student.nome} foi movido para ${columns.find(c => c.id === previousStatus)?.title}`
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      
      // Reverter para o status anterior no caso de erro
      const originalStudent = students.find(s => s.id === studentId);
      if (originalStudent) {
        updateLocalStudent({...originalStudent});
        onStudentUpdate({...originalStudent});
      }
      
      toast.error("Erro ao mover o aluno", {
        description: "Verifique sua conexão e tente novamente."
      });
    } finally {
      setProcessingStudentId(null);
    }
  };

  return (
    <div className="w-full overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Quadro de Cobrança</h2>
        {isFiltered && (
          <div className="text-sm text-gray-500">
            Exibindo {studentsToShow.length} de {students.length} alunos
          </div>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => (
          <div 
            key={column.id}
            className="flex-shrink-0 w-72 rounded-lg border shadow-sm"
          >
            {/* Cabeçalho da coluna */}
            <div className={`p-3 rounded-t-lg ${column.color} text-white font-medium flex justify-between items-center`}>
              <h3>{column.title}</h3>
              <span className="bg-white text-gray-800 text-xs px-2 py-1 rounded-full">
                {studentsByStatus[column.id].length}
              </span>
            </div>
            
            {/* Cartões dos alunos */}
            <div className="p-2 bg-gray-50 rounded-b-lg kanban-column">
              {studentsByStatus[column.id].length > 0 ? (
                studentsByStatus[column.id].map(student => (
                  <StudentCard 
                    key={student.id} 
                    student={student}
                    onStatusChange={handleStatusChange}
                    onReturnToPrevious={handleReturnToPreviousStatus}
                  />
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 italic text-sm">
                  Nenhum aluno nesta etapa
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;
