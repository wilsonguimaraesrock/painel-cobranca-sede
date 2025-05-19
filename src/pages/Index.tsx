
import { useState, useEffect } from "react";
import { Student } from "@/types";
import { getSheetData } from "@/lib/googleSheetsApi";
import MonthSelector from "@/components/MonthSelector";
import Dashboard from "@/components/Dashboard";
import KanbanBoard from "@/components/KanbanBoard";
import UserStatus from "@/components/UserStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const Index = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
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
        setFilteredStudents([]);
        setActiveFilter(null);
        
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

  // Aplicar filtros com base na seleção de cartão
  const handleFilterChange = (filterId: string | null) => {
    if (!filterId) {
      setFilteredStudents([]);
      setActiveFilter(null);
      return;
    }
    
    let filtered: Student[] = [];
    
    switch(filterId) {
      case 'all':
        // Todos os alunos inadimplentes de qualquer categoria
        filtered = students.filter(student => 
          student.status === "inadimplente" || 
          student.status === "mensagem-enviada" || 
          student.status === "resposta-recebida"
        );
        break;
      case 'ate5dias':
        filtered = students.filter(student => student.diasAtraso <= 5);
        break;
      case 'ate10dias':
        filtered = students.filter(student => student.diasAtraso > 5 && student.diasAtraso <= 10);
        break;
      case 'mais10dias':
        filtered = students.filter(student => student.diasAtraso > 10);
        break;
      default:
        filtered = [];
    }
    
    setFilteredStudents(filtered);
    setActiveFilter(filterId);
    
    toast.info(`Filtro aplicado: ${filterId}`, {
      description: `Exibindo ${filtered.length} alunos`
    });
  };

  // Função para atualizar um estudante específico
  const handleStudentUpdate = (updatedStudent: Student) => {
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === updatedStudent.id ? updatedStudent : student
      )
    );
    
    // Atualizar também os estudantes filtrados se o filtro estiver ativo
    if (activeFilter) {
      setFilteredStudents(prevFiltered => {
        const studentInFiltered = prevFiltered.some(s => s.id === updatedStudent.id);
        
        // Se o estudante já estava nos filtrados, atualiza-o
        if (studentInFiltered) {
          return prevFiltered.map(student => 
            student.id === updatedStudent.id ? updatedStudent : student
          );
        }
        
        return prevFiltered;
      });
    }
  };

  // Renderizar estados de carregamento
  if (!selectedMonth) {
    return (
      <div className="container mx-auto p-4">
        <div className="w-full bg-primary text-primary-foreground py-4 mb-8 rounded-md shadow-md">
          <div className="flex justify-between items-center px-4">
            <h1 className="text-3xl font-bold">CRM de Cobrança - Rockfeller Navegantes</h1>
            <UserStatus />
          </div>
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
        <div className="flex justify-between items-center px-4">
          <h1 className="text-3xl font-bold">CRM de Cobrança - Rockfeller Navegantes</h1>
          <UserStatus />
        </div>
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
          <Dashboard 
            students={students} 
            onFilterChange={handleFilterChange}
            activeFilter={activeFilter}
          />
          <KanbanBoard
            students={students}
            filteredStudents={filteredStudents}
            isFiltered={!!activeFilter}
            onStudentUpdate={handleStudentUpdate}
          />
        </>
      )}
    </div>
  );
};

export default Index;
