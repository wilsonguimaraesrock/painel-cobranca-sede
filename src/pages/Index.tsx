import { useState, useEffect, useCallback } from "react";
import { Student } from "@/types";
import Dashboard from "@/components/Dashboard";
import KanbanBoard from "@/components/KanbanBoard";
import { Button } from "@/components/ui/button";
import { Plus, Download, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DataLoader from "@/components/DataLoader";
import LoadingSkeletons from "@/components/LoadingSkeletons";
import PageHeader from "@/components/PageHeader";
import MonthSelectorWithCount from "@/components/MonthSelectorWithCount";
import { getSheetData, formatCurrency } from "@/lib/googleSheetsApi";
import { saveStudents } from "@/services/supabaseService";
import { toast } from "sonner";

// Mapeamento de meses para nomes de abas do Google Sheets
const monthSheetMap: Record<string, string> = {
  '05-2025': 'MAIO/25',
  'MAIO/25': 'MAIO/25',
  // Adicione outros mapeamentos conforme necessário
};

const Index = () => {
  // All state hooks at the top
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loadingSource, setLoadingSource] = useState<"sheets" | "database" | "">("");
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const navigate = useNavigate();

  // Debug logging function
  const addDebugInfo = (message: string) => {
    console.log(`[DEBUG] ${message}`);
    setDebugInfo(prev => prev + `\n${new Date().toLocaleTimeString()}: ${message}`);
  };

  // Handle data loaded from DataLoader component
  const handleDataLoaded = useCallback((loadedStudents: Student[], source: "sheets" | "database" | "") => {
    console.log("Data loaded:", loadedStudents.length, "students from source:", source);
    addDebugInfo(`Data loaded: ${loadedStudents.length} students from source: ${source}`);
    setStudents(loadedStudents);
    setFilteredStudents([]);
    setActiveFilter(null);
    setLoadingSource(source);
  }, []);

  // Debug logging
  useEffect(() => {
    if (!loading && students.length > 0) {
      console.log("Current state - Total students:", students.length);
      addDebugInfo(`Current state - Total students: ${students.length}`);
      console.log("Status distribution:", {
        inadimplente: students.filter(s => s.status === "inadimplente").length,
        mensagemEnviada: students.filter(s => s.status === "mensagem-enviada").length,
        respostaRecebida: students.filter(s => s.status === "resposta-recebida").length,
        pagamentoFeito: students.filter(s => s.status === "pagamento-feito").length
      });
    }
  }, [loading, students]);

  // Calculate total in default
  const totalEmInadimplencia = students
    .filter(s => s.status !== "pagamento-feito")
    .reduce((total, student) => total + student.valor, 0);

  // Force import from sheet
  const handleForceImport = async () => {
    if (!selectedMonth) {
      toast.error("Select a month before importing data");
      return;
    }
    
    try {
      setIsImporting(true);
      addDebugInfo(`Starting data import for month ${selectedMonth}...`);
      toast.info(`Starting data import for month ${selectedMonth}...`);
      
      // Usar o nome correto da aba
      const sheetName = monthSheetMap[selectedMonth] || selectedMonth;
      
      // Get data directly from sheet
      const sheetsData = await getSheetData(sheetName);
      
      if (sheetsData.length === 0) {
        toast.error(`No students found in spreadsheet for month ${selectedMonth}`);
        addDebugInfo(`No students found in spreadsheet for month ${selectedMonth}`);
        setIsImporting(false);
        return;
      }
      
      console.log(`Importing ${sheetsData.length} students from spreadsheet for month ${selectedMonth}`);
      addDebugInfo(`Importing ${sheetsData.length} students from spreadsheet`);
      
      // Save to database
      await saveStudents(sheetsData, selectedMonth);
      
      // Update student list
      handleDataLoaded(sheetsData, "sheets");
      
      toast.success(`Import completed successfully`, {
        description: `${sheetsData.length} students were imported to the database`
      });
    } catch (error) {
      console.error("Error importing data:", error);
      addDebugInfo(`Error importing data: ${error}`);
      toast.error("Error importing data from spreadsheet", {
        description: "Check your connection and try again."
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
    console.log(`Updating student ${updatedStudent.id} with status ${updatedStudent.status}`);
    
    // Check if this is a delete operation (hack: we identify deletes by receiving a student object with just an id)
    const isDeleteOperation = Object.keys(updatedStudent).length === 1 && updatedStudent.id;
    
    if (isDeleteOperation) {
      console.log(`Deleting student ${updatedStudent.id} from local state`);
      // Remove the student from state
      setStudents(prevStudents => 
        prevStudents.filter(student => student.id !== updatedStudent.id)
      );
      
      // Also update filtered students if filter is active
      if (activeFilter) {
        setFilteredStudents(prevFiltered => 
          prevFiltered.filter(student => student.id !== updatedStudent.id)
        );
      }
      return;
    }
    
    // Otherwise, this is a regular update
    // Update local state first to reflect changes immediately
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === updatedStudent.id ? updatedStudent : student
      )
    );
    
    // Also update filtered students if filter is active
    if (activeFilter) {
      setFilteredStudents(prevFiltered => {
        const studentInFiltered = prevFiltered.some(s => s.id === updatedStudent.id);
        
        if (studentInFiltered) {
          return prevFiltered.map(student => 
            student.id === updatedStudent.id ? updatedStudent : student
          );
        }
        
        return prevFiltered;
      });
    }
  }, [activeFilter]);

  // Render content based on loading state and selected month
  const renderContent = () => {
    addDebugInfo(`Rendering content - selectedMonth: ${selectedMonth}, loading: ${loading}, students: ${students.length}`);
    
    if (!selectedMonth) {
      return (
        <div className="mt-8 text-center text-gray-500">
          <p>Select a month to view data</p>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">Debug: No month selected</p>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div>
          <LoadingSkeletons />
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">Debug: Loading data for month {selectedMonth}</p>
          </div>
        </div>
      );
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
        {/* Debug Panel */}
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <details>
            <summary className="cursor-pointer font-medium">Debug Information</summary>
            <div className="mt-2 text-xs text-gray-600">
              <p>Selected Month: {selectedMonth}</p>
              <p>Students Count: {students.length}</p>
              <p>Loading: {loading.toString()}</p>
              <p>Loading Source: {loadingSource}</p>
              <p>Active Filter: {activeFilter || 'none'}</p>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded max-h-32 overflow-y-auto whitespace-pre-wrap">
                {debugInfo}
              </pre>
            </div>
          </details>
        </div>
      </>
    );
  };

  // Handle loading state changes
  const handleLoadingChange = useCallback((isLoading: boolean) => {
    console.log(`Loading state changed to: ${isLoading}`);
    addDebugInfo(`Loading state changed to: ${isLoading}`);
    setLoading(isLoading);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="CRM de Cobrança - Rockfeller Navegantes" />
      
      <div className="flex justify-between items-center mb-8 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <MonthSelectorWithCount
            onMonthChange={(month) => {
              console.log(`Month selected: ${month}`);
              addDebugInfo(`Month selected: ${month}`);
              setSelectedMonth(month);
            }}
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
            {isImporting ? "Importing..." : "Import from Spreadsheet"}
          </Button>
          
          {!loading && students.length > 0 && (
            <div className="flex items-center px-4 py-2 bg-orange-100 border border-orange-200 rounded-md text-orange-800 font-medium">
              <DollarSign className="h-4 w-4 mr-1" />
              Total em inadimplência: {formatCurrency(totalEmInadimplencia)}
            </div>
          )}
        </div>
        <Button 
          onClick={() => navigate("/register-student")}
          className="flex items-center gap-2 bg-primary text-white"
        >
          <Plus className="h-4 w-4" />
          Novo Aluno
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
