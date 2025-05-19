
import { useState, useEffect, useCallback } from "react";
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
  // All state hooks at the top
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loadingSource, setLoadingSource] = useState<"sheets" | "database" | "">("");
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const navigate = useNavigate();

  // Use useCallback for functions that are passed as props
  const handleDataLoaded = useCallback((loadedStudents: Student[], source: "sheets" | "database" | "") => {
    console.log("Dados carregados:", loadedStudents.length, "alunos da fonte:", source);
    setStudents(loadedStudents);
    setFilteredStudents([]);
    setActiveFilter(null);
    setLoadingSource(source);
  }, []);

  // Debug logging effect
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

  // Function to force importing data
  const handleForceImport = async () => {
    if (!selectedMonth) {
      toast.error("Selecione um mês antes de importar os dados");
      return;
    }
    
    try {
      setIsImporting(true);
      toast.info(`Iniciando importação dos dados para o mês ${selectedMonth}...`);
      
      // Get data directly from the sheet
      const sheetsData = await getSheetData(selectedMonth);
      
      if (sheetsData.length === 0) {
        toast.error(`Não foram encontrados alunos na planilha para o mês ${selectedMonth}`);
        setIsImporting(false);
        return;
      }
      
      console.log(`Importando ${sheetsData.length} alunos da planilha para o mês ${selectedMonth}`);
      
      // Save data to the database
      await saveStudents(sheetsData, selectedMonth);
      
      // Update the student list
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

  // Apply filters based on card selection
  const handleFilterChange = useCallback((filterId: string | null) => {
    if (!filterId) {
      setFilteredStudents([]);
      setActiveFilter(null);
      return;
    }
    
    let filtered: Student[] = [];
    
    switch(filterId) {
      case 'all':
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
  }, [students]);

  // Function to update a specific student
  const handleStudentUpdate = useCallback((updatedStudent: Student) => {
    console.log(`Atualizando estudante ${updatedStudent.id} com status ${updatedStudent.status}`);
    
    // Update local state first
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === updatedStudent.id ? updatedStudent : student
      )
    );
    
    // Also update filtered students if filter is active
    if (activeFilter) {
      setFilteredStudents(prevFiltered => {
        const studentInFiltered = prevFiltered.some(s => s.id === updatedStudent.id);
        
        // If student was already in filtered, update it
        if (studentInFiltered) {
          return prevFiltered.map(student => 
            student.id === updatedStudent.id ? updatedStudent : student
          );
        }
        
        return prevFiltered;
      });
    }
  }, [activeFilter]);

  // Function for conditional rendering of content
  const renderContent = () => {
    // Conditional rendering for when no month is selected
    if (!selectedMonth) {
      return (
        <div className="mt-8 text-center text-gray-500">
          Selecione um mês para visualizar os dados
        </div>
      );
    }

    if (loading) {
      return <LoadingSkeletons />;
    }

    return (
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
    );
  };

  // Define handleLoadingChange as a callback to prevent re-renders
  const handleLoadingChange = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

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
      
      <DataLoader 
        selectedMonth={selectedMonth}
        onDataLoaded={handleDataLoaded}
        onLoadingChange={handleLoadingChange}
      />
      
      {renderContent()}
    </div>
  );
};

export default Index;
