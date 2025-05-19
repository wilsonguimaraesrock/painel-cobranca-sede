
import { useState, useEffect } from "react";
import { Student } from "@/types";
import Dashboard from "@/components/Dashboard";
import KanbanBoard from "@/components/KanbanBoard";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DataLoader from "@/components/DataLoader";
import LoadingSkeletons from "@/components/LoadingSkeletons";
import PageHeader from "@/components/PageHeader";
import MonthSelectorWithCount from "@/components/MonthSelectorWithCount";
import { getSheetData } from "@/lib/googleSheetsApi";
import { saveStudents } from "@/services/supabaseService";
import { toast } from "sonner";

const Index = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loadingSource, setLoadingSource] = useState<"sheets" | "database" | "">("");
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const navigate = useNavigate();

  // Função para lidar com os dados carregados
  const handleDataLoaded = (loadedStudents: Student[], source: "sheets" | "database" | "") => {
    console.log("Dados carregados:", loadedStudents.length, "alunos da fonte:", source);
    setStudents(loadedStudents);
    setFilteredStudents([]);
    setActiveFilter(null);
    setLoadingSource(source);
  };

  // Função para forçar importação completa dos dados da planilha para o banco
  const handleForceImport = async () => {
    if (!selectedMonth) {
      toast.error("Selecione um mês antes de importar os dados");
      return;
    }
    
    try {
      setIsImporting(true);
      toast.info(`Iniciando importação dos dados para o mês ${selectedMonth}...`);
      
      // Busca dados diretamente da planilha
      const sheetsData = await getSheetData(selectedMonth);
      
      if (sheetsData.length === 0) {
        toast.error(`Não foram encontrados alunos na planilha para o mês ${selectedMonth}`);
        setIsImporting(false);
        return;
      }
      
      console.log(`Importando ${sheetsData.length} alunos da planilha para o mês ${selectedMonth}`);
      
      // Salva os dados no banco de dados
      await saveStudents(sheetsData, selectedMonth);
      
      // Atualiza a lista de estudantes
      handleDataLoaded(sheetsData, "sheets");
      
      toast.success(`Importação concluída com sucesso`, {
        description: `${sheetsData.length} alunos foram importados para o banco de dados`
      });
    } catch (error) {
      console.error("Erro ao importar dados:", error);
      toast.error("Erro ao importar dados da planilha", {
        description: "Verifique sua conexão e tente novamente."
      });
    } finally {
      setIsImporting(false);
    }
  };

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
  };

  // Adicionar log para debug
  useEffect(() => {
    if (!loading && students.length > 0) {
      console.log("Estado atual - Total de alunos:", students.length);
      console.log("Distribuição de status:", {
        inadimplente: students.filter(s => s.status === "inadimplente").length,
        mensagemEnviada: students.filter(s => s.status === "mensagem-enviada").length,
        respostaRecebida: students.filter(s => s.status === "resposta-recebida").length,
        pagamentoFeito: students.filter(s => s.status === "pagamento-feito").length
      });
    }
  }, [loading, students]);

  // Renderização condicional para quando não há mês selecionado
  if (!selectedMonth) {
    return (
      <div className="container mx-auto p-4">
        <PageHeader title="CRM de Cobrança - Rockfeller Navegantes" />
        <MonthSelectorWithCount
          onMonthChange={setSelectedMonth}
          studentsCount={0}
          loadingSource=""
          loading={true}
        />
        <div className="mt-8 text-center text-gray-500">
          Selecione um mês para visualizar os dados
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="CRM de Cobrança - Rockfeller Navegantes" />
      
      <div className="flex justify-between items-center mb-8 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <MonthSelectorWithCount
            onMonthChange={setSelectedMonth}
            studentsCount={students.length}
            loadingSource={loadingSource}
            loading={loading}
          />
          <Button
            onClick={handleForceImport}
            disabled={isImporting || !selectedMonth}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isImporting ? "Importando..." : "Importar da Planilha"}
          </Button>
        </div>
        <Button 
          onClick={() => navigate("/register-student")}
          className="flex items-center gap-2 bg-primary text-white"
        >
          <Plus className="h-4 w-4" />
          Cadastrar Novo Aluno
        </Button>
      </div>
      
      {/* Componente invisível que cuida do carregamento de dados */}
      <DataLoader 
        selectedMonth={selectedMonth}
        onDataLoaded={handleDataLoaded}
        onLoadingChange={setLoading}
      />
      
      {loading ? (
        <LoadingSkeletons />
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
