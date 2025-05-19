
import { useState, useEffect } from "react";
import { Student } from "@/types";
import { getSheetData } from "@/lib/googleSheetsApi";
import MonthSelector from "@/components/MonthSelector";
import Dashboard from "@/components/Dashboard";
import KanbanBoard from "@/components/KanbanBoard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const Index = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  // Carregar dados quando o mês muda
  useEffect(() => {
    if (!selectedMonth) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getSheetData(selectedMonth);
        
        // Inicializa todos os estudantes como "inadimplentes" por padrão
        const initializedData = data.map(student => ({
          ...student,
          status: "inadimplente" as const
        }));
        
        setStudents(initializedData);
        
        toast.success(`Dados carregados com sucesso`, {
          description: `${initializedData.length} alunos encontrados na planilha ${selectedMonth}`
        });
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados da planilha", {
          description: "Verifique sua conexão e tente novamente."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth]);

  // Função para atualizar um estudante específico
  const handleStudentUpdate = (updatedStudent: Student) => {
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === updatedStudent.id ? updatedStudent : student
      )
    );
  };

  // Renderizar estados de carregamento
  if (!selectedMonth) {
    return (
      <div className="container mx-auto p-4">
        <div className="w-full bg-primary text-primary-foreground py-4 mb-8 rounded-md shadow-md">
          <h1 className="text-3xl font-bold text-center">CRM de Cobrança - Rockfeller Navegantes</h1>
        </div>
        <MonthSelector onMonthChange={setSelectedMonth} />
        <div className="mt-8 text-center text-gray-500">
          Selecione um mês para visualizar os dados
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="w-full bg-primary text-primary-foreground py-4 mb-4 rounded-md shadow-md">
        <h1 className="text-3xl font-bold text-center">CRM de Cobrança - Rockfeller Navegantes</h1>
      </div>
      
      <div className="flex justify-between items-center mb-8">
        <MonthSelector onMonthChange={setSelectedMonth} />
        {!loading && (
          <div className="text-sm text-gray-500">
            {students.length} alunos encontrados
          </div>
        )}
      </div>
      
      {loading ? (
        <>
          {/* Skeleton para o Dashboard */}
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
          
          {/* Skeleton para o Kanban */}
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="flex-shrink-0 w-72 h-[500px]" />
            ))}
          </div>
        </>
      ) : (
        <>
          <Dashboard students={students} />
          <KanbanBoard
            students={students}
            onStudentUpdate={handleStudentUpdate}
          />
        </>
      )}
    </div>
  );
};

export default Index;
