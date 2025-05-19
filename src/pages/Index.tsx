
import { useState, useEffect } from "react";
import { Student } from "@/types";
import { getSheetData } from "@/lib/googleSheetsApi";
import MonthSelector from "@/components/MonthSelector";
import Dashboard from "@/components/Dashboard";
import KanbanBoard from "@/components/KanbanBoard";
import UserStatus from "@/components/UserStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { saveStudents, getStudents, checkMonthData } from "@/services/supabaseService";

const Index = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loadingSource, setLoadingSource] = useState<"sheets" | "database" | "">("");

  // Carregar dados quando o mês muda
  useEffect(() => {
    if (!selectedMonth) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Primeiro sempre carregamos da planilha do Google
        setLoadingSource("sheets");
        const sheetsData = await getSheetData(selectedMonth);
        
        if (sheetsData.length === 0) {
          toast.error(`Não foram encontrados alunos na planilha para o mês ${selectedMonth}`);
          setLoading(false);
          setLoadingSource("");
          return;
        }
        
        // Verificar se já existem dados no banco para este mês
        const hasData = await checkMonthData(selectedMonth);
        
        if (hasData) {
          // Se existem dados no banco, carregamos para ter as informações de status mais atualizadas
          setLoadingSource("database");
          const dbStudents = await getStudents(selectedMonth);
          
          if (dbStudents.length > 0) {
            // Mesclar dados da planilha com status do banco
            const mergedStudents = sheetsData.map(sheetStudent => {
              const dbStudent = dbStudents.find(db => 
                db.nome === sheetStudent.nome && 
                db.valor === sheetStudent.valor && 
                db.dataVencimento === sheetStudent.dataVencimento
              );
              
              if (dbStudent) {
                return {
                  ...sheetStudent,
                  id: dbStudent.id, // Mantemos o ID do banco de dados
                  status: dbStudent.status,
                  statusHistory: dbStudent.statusHistory || [],
                  observacoes: dbStudent.observacoes || sheetStudent.observacoes,
                  email: dbStudent.email || sheetStudent.email,
                  telefone: dbStudent.telefone || sheetStudent.telefone,
                  primeiroContato: dbStudent.primeiroContato || sheetStudent.primeiroContato,
                  ultimoContato: dbStudent.ultimoContato || sheetStudent.ultimoContato
                };
              }
              
              return sheetStudent;
            });
            
            setStudents(mergedStudents);
            
            // Salvar dados mesclados no banco
            await saveStudents(mergedStudents, selectedMonth);
            
            toast.success(`Dados carregados e atualizados`, {
              description: `${mergedStudents.length} alunos para o mês ${selectedMonth}`
            });
          } else {
            // Apenas salvamos os dados da planilha no banco
            setStudents(sheetsData);
            await saveStudents(sheetsData, selectedMonth);
            
            toast.success(`Dados carregados da planilha`, {
              description: `${sheetsData.length} alunos para o mês ${selectedMonth}`
            });
          }
        } else {
          // Se não existem dados no banco, salvamos os da planilha
          setStudents(sheetsData);
          await saveStudents(sheetsData, selectedMonth);
          
          toast.success(`Dados carregados da planilha e salvos no banco`, {
            description: `${sheetsData.length} alunos para o mês ${selectedMonth}`
          });
        }
        
        setFilteredStudents([]);
        setActiveFilter(null);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados", {
          description: "Verifique sua conexão e tente novamente."
        });
      } finally {
        setLoading(false);
        setLoadingSource("");
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
  const handleStudentUpdate = async (updatedStudent: Student) => {
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
    
    // Salvar no banco de dados
    try {
      await saveStudents([updatedStudent], selectedMonth);
    } catch (error) {
      console.error("Erro ao salvar alterações no banco de dados:", error);
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
            {loadingSource && ` (${loadingSource === "database" ? "do banco de dados" : "da planilha"})`}
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
