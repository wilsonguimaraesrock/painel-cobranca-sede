
import { useState, useEffect, useRef } from "react";
import { Student } from "@/types";
import { getStudents, checkMonthData, getStudentsWithVencimentoFilter } from "@/services/supabaseService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface DataLoaderProps {
  selectedMonth: string;
  onDataLoaded: (students: Student[], source: "sheets" | "database" | "") => void;
  onLoadingChange: (loading: boolean) => void;
  refreshTrigger?: number; // Add trigger to force refresh
}

const DataLoader = ({ selectedMonth, onDataLoaded, onLoadingChange, refreshTrigger }: DataLoaderProps) => {
  // Hooks at the top
  const [loadingSource, setLoadingSource] = useState<"sheets" | "database" | "">("");
  const isMountedRef = useRef(true);
  const { username } = useAuth();
  
  // Effect for cleanup when unmounting
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Effect for loading data when month changes
  useEffect(() => {
    // Skip loading if no month selected
    if (!selectedMonth) {
      console.log('[DataLoader] No month selected, skipping data load');
      onLoadingChange(false);
      return;
    }
    
    console.log('[DataLoader] Mês selecionado para busca:', selectedMonth);
    
    const fetchData = async () => {
      if (!isMountedRef.current) return;
      
      try {
        // Start loading
        onLoadingChange(true);
        console.log(`[DataLoader] Loading data for month: ${selectedMonth}`);
        
        // Check if data exists in database
        console.log(`[DataLoader] Checking if data exists in database for month: ${selectedMonth}`);
        const hasData = await checkMonthData(selectedMonth);
        console.log(`[DataLoader] Data exists in database for month ${selectedMonth}: ${hasData}`);
        
        // Return early if component unmounted
        if (!isMountedRef.current) return;
        
        if (hasData) {
          // Load from database with vencimento filter
          console.log(`[DataLoader] Loading from database with vencimento filter for month: ${selectedMonth}`);
          setLoadingSource("database");
          const dbStudents = await getStudentsWithVencimentoFilter(selectedMonth);
          
          // Return early if component unmounted
          if (!isMountedRef.current) return;
          
          console.log(`[DataLoader] Loaded ${dbStudents.length} students from database with vencimento filter for month ${selectedMonth}`);
          console.log("[DataLoader] Students data:", dbStudents);
          
          if (dbStudents.length > 0) {
            onDataLoaded(dbStudents, "database");
            toast.success(`Dados carregados do banco de dados`, {
              description: `${dbStudents.length} estudantes para o mês ${selectedMonth} (incluindo vencimentos de outros meses)`
            });
          } else {
            console.log(`[DataLoader] No students found despite hasData being true`);
            toast.info(`Nenhum estudante encontrado no banco para o mês ${selectedMonth}`, {
              description: "Use o botão 'Importar da Planilha' para importar dados"
            });
            onDataLoaded([], "database");
          }
        } else {
          // No data in database
          if (!isMountedRef.current) return;
          
          console.log(`[DataLoader] No data in database for month ${selectedMonth}, trying to load anyway...`);
          
          // Try to load students anyway in case the count check failed
          const dbStudents = await getStudentsWithVencimentoFilter(selectedMonth);
          
          if (dbStudents.length > 0) {
            console.log(`[DataLoader] Found ${dbStudents.length} students despite checkMonthData returning false`);
            onDataLoaded(dbStudents, "database");
            toast.success(`Dados carregados do banco de dados`, {
              description: `${dbStudents.length} estudantes para o mês ${selectedMonth} (incluindo vencimentos de outros meses)`
            });
          } else {
            console.log(`[DataLoader] No students found for month ${selectedMonth}`);
            toast.info(`Nenhum dado encontrado para o mês ${selectedMonth}`, {
              description: "Use o botão 'Importar da Planilha' para importar dados"
            });
            onDataLoaded([], "");
          }
        }
      } catch (error) {
        // Return early if component unmounted
        if (!isMountedRef.current) return;
        
        console.error("[DataLoader] Error loading data:", error);
        toast.error("Erro ao carregar dados", {
          description: "Verifique sua conexão e tente novamente."
        });
        onDataLoaded([], "");
      } finally {
        if (isMountedRef.current) {
          console.log(`[DataLoader] Loading completed for month: ${selectedMonth}`);
          onLoadingChange(false);
          setLoadingSource("");
        }
      }
    };

    // Start fetching data
    fetchData();
  }, [selectedMonth, onDataLoaded, onLoadingChange, refreshTrigger]);

  // This component doesn't render anything
  return null;
};

export default DataLoader;
