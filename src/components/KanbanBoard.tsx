
import { useState } from "react";
import { Student, Status } from "@/types";
import StudentCard from "./StudentCard";
import { toast } from "sonner";

interface KanbanBoardProps {
  students: Student[];
  onStudentUpdate: (updatedStudent: Student) => void;
}

const KanbanBoard = ({ students, onStudentUpdate }: KanbanBoardProps) => {
  // Definição das colunas do Kanban
  const columns: { id: Status; title: string; color: string }[] = [
    { id: "inadimplente", title: "Alunos Inadimplentes", color: "bg-kanban-overdue" },
    { id: "mensagem-enviada", title: "Mensagem Enviada", color: "bg-kanban-sent" },
    { id: "resposta-recebida", title: "Resposta Recebida", color: "bg-kanban-replied" },
    { id: "pagamento-feito", title: "Pagamento Realizado", color: "bg-kanban-paid" }
  ];

  // Agrupar estudantes por status
  const studentsByStatus: Record<Status, Student[]> = {
    "inadimplente": [],
    "mensagem-enviada": [],
    "resposta-recebida": [],
    "pagamento-feito": []
  };

  students.forEach(student => {
    studentsByStatus[student.status].push(student);
  });

  // Função para alterar o status de um aluno
  const handleStatusChange = (studentId: string, newStatus: Status) => {
    const student = students.find(s => s.id === studentId);
    
    if (!student) return;
    
    // Verificar se o campo follow up está preenchido
    if (student.followUp.trim() === "" && student.status !== "pagamento-feito") {
      toast.error("O campo 'Follow Up' precisa ser preenchido para mover o aluno", {
        description: "Atualize o campo na planilha e tente novamente."
      });
      return;
    }
    
    // Atualizar o status
    const updatedStudent = { ...student, status: newStatus };
    onStudentUpdate(updatedStudent);
    
    // Mensagem de confirmação
    toast.success(`Aluno movido com sucesso`, {
      description: `${student.nome} foi movido para ${columns.find(c => c.id === newStatus)?.title}`
    });
  };

  return (
    <div className="w-full overflow-hidden">
      <h2 className="text-2xl font-bold mb-4">Quadro de Cobrança</h2>
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
