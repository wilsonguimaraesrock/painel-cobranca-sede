
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
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loadingSource, setLoadingSource] = useState<"sheets" | "database" | "">("");
  const [initialLoadDone, setInitialLoadDone] = useState<boolean>(false);
  const [databaseLoaded, setDatabaseLoaded] = useState<boolean>(false);
  const navigate = useNavigate();

  // Carregar dados quando o mês muda
  useEffect(() => {
    if (!selectedMonth) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log(`Carregando dados para o mês: ${selectedMonth}`);
        
        // Primeiro verificar se existem dados no banco para este mês
        const hasData = await checkMonthData(selectedMonth);
        console.log(`Dados existentes no banco para o mês ${selectedMonth}: ${hasData}`);
        
        if (hasData) {
          // Se existem dados no banco, carregamos eles primeiro
          setLoadingSource("database");
          const dbStudents = await getStudents(selectedMonth);
          console.log(`Carregados ${dbStudents.length} alunos do banco para o mês ${selectedMonth}`);
          
          if (dbStudents.length > 0) {
            setStudents(dbStudents);
            setDatabaseLoaded(true);
            toast.success(`Dados carregados do banco de dados`, {
              description: `${dbStudents.length} alunos para o mês ${selectedMonth}`
            });

            // Depois carregamos dados da planilha apenas para complementar informações, 
            // sem sobrescrever status ou histórico do banco
            setLoadingSource("sheets");
            const sheetsData = await getSheetData(selectedMonth);
            console.log(`Carregados ${sheetsData.length} alunos da planilha para o mês ${selectedMonth}`);
            
            // Mesclar apenas dados da planilha que não existem no banco ou precisam de atualização
            if (sheetsData.length > 0) {
              // Criar um mapa dos estudantes do banco pelo nome para identificar correspondências
              const dbStudentsByName = new Map();
              dbStudents.forEach(s => {
                // Usar o nome como chave principal para correspondência
                dbStudentsByName.set(s.nome.toLowerCase().trim(), s);
              });
              
              // Atualizar estudantes existentes e adicionar novos
              const updatedStudents = [...dbStudents];
              const newStudents: Student[] = [];
              
              sheetsData.forEach(sheetStudent => {
                // Tentar encontrar correspondência por nome
                const existingStudent = dbStudentsByName.get(sheetStudent.nome.toLowerCase().trim());
                
                if (existingStudent) {
                  // Atualiza apenas os campos da planilha, mantendo os dados do banco
                  // Especialmente status e historico
                  const updatedIndex = updatedStudents.findIndex(s => s.id === existingStudent.id);
                  if (updatedIndex >= 0) {
                    updatedStudents[updatedIndex] = {
                      ...existingStudent,
                      // Atualizamos apenas os dados que vêm da planilha
                      valor: sheetStudent.valor,
                      dataVencimento: sheetStudent.dataVencimento,
                      diasAtraso: sheetStudent.diasAtraso,
                      followUp: sheetStudent.followUp || existingStudent.followUp,
                      observacoes: sheetStudent.observacoes || existingStudent.observacoes,
                      primeiroContato: existingStudent.primeiroContato || sheetStudent.primeiroContato,
                      ultimoContato: existingStudent.ultimoContato || sheetStudent.ultimoContato,
                      // Mantemos o status e histórico do banco - IMPORTANTE!
                      status: existingStudent.status,
                      statusHistory: existingStudent.statusHistory
                    };
                  }
                } else {
                  // Este é um novo estudante da planilha que não existe no banco
                  newStudents.push(sheetStudent);
                }
              });
              
              // Adicionar novos estudantes à lista
              if (newStudents.length > 0) {
                updatedStudents.push(...newStudents);
                toast.info(`Adicionados ${newStudents.length} novos alunos da planilha`, {
                  description: `Total agora: ${updatedStudents.length} alunos`
                });
              }
              
              // Atualizar estado
              setStudents(updatedStudents);
              
              // Salvar novos estudantes e atualizações no banco
              if (newStudents.length > 0) {
                await saveStudents(newStudents, selectedMonth);
              }
            }
          } else {
            // Se o banco retornou vazio (pode ser erro ou primeira carga), carregamos da planilha
            setLoadingSource("sheets");
            const sheetsData = await getSheetData(selectedMonth);
            
            if (sheetsData.length === 0) {
              toast.error(`Não foram encontrados alunos na planilha para o mês ${selectedMonth}`);
              setLoading(false);
              setLoadingSource("");
              return;
            }
            
            console.log(`Carregados ${sheetsData.length} alunos da planilha para o mês ${selectedMonth}`);
            setStudents(sheetsData);
            
            // Salvamos os dados da planilha no banco
            await saveStudents(sheetsData, selectedMonth);
            
            toast.success(`Dados carregados da planilha e salvos no banco`, {
              description: `${sheetsData.length} alunos para o mês ${selectedMonth}`
            });
          }
        } else {
          // Se não existem dados no banco, carregamos da planilha
          setLoadingSource("sheets");
          const sheetsData = await getSheetData(selectedMonth);
          
          if (sheetsData.length === 0) {
            toast.error(`Não foram encontrados alunos na planilha para o mês ${selectedMonth}`);
            setLoading(false);
            setLoadingSource("");
            return;
          }
          
          console.log(`Carregados ${sheetsData.length} alunos da planilha para o mês ${selectedMonth}`);
          setStudents(sheetsData);
          
          // Salvamos os dados da planilha no banco
          await saveStudents(sheetsData, selectedMonth);
          
          toast.success(`Dados carregados da planilha e salvos no banco`, {
            description: `${sheetsData.length} alunos para o mês ${selectedMonth}`
          });
        }
        
        setFilteredStudents([]);
        setActiveFilter(null);
        setInitialLoadDone(true);
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
    console.log(`Atualizando estudante ${updatedStudent.id} com status ${updatedStudent.status}`);
    
    // Atualizar o estado local primeiro
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
      console.log(`Salvando atualização do estudante ${updatedStudent.id} no banco`);
      await saveStudents([updatedStudent], selectedMonth);
      console.log(`Estudante ${updatedStudent.id} salvo com sucesso`);
      
      // Notificar o usuário que a atualização foi salva
      toast.success(`Dados do aluno ${updatedStudent.nome} salvos com sucesso`);
    } catch (error) {
      console.error("Erro ao salvar alterações no banco de dados:", error);
      toast.error("Erro ao salvar alterações", {
        description: "Não foi possível salvar as alterações no banco de dados."
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
      
      <div className="flex justify-between items-center mb-8 flex-wrap gap-2">
        <div className="flex items-center flex-grow">
          <MonthSelector onMonthChange={setSelectedMonth} />
          {!loading && (
            <div className="text-sm text-gray-500 ml-4">
              {students.length} alunos encontrados
              {loadingSource && ` (${loadingSource === "database" ? "do banco de dados" : "da planilha"})`}
            </div>
          )}
        </div>
        <Button 
          onClick={() => navigate("/register-student")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Cadastrar Novo Aluno
        </Button>
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
