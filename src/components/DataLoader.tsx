import { useState, useEffect, useRef } from "react";
import { Student } from "@/types";
import { getStudents, checkMonthData } from "@/services/supabaseService";
import { toast } from "sonner";

interface DataLoaderProps {
  selectedMonth: string;
  onDataLoaded: (students: Student[], source: "sheets" | "database" | "") => void;
  onLoadingChange: (loading: boolean) => void;
}

const DataLoader = ({ selectedMonth, onDataLoaded, onLoadingChange }: DataLoaderProps) => {
  // Hooks at the top
  const [loadingSource, setLoadingSource] = useState<"sheets" | "database" | "">("");
  const isMountedRef = useRef(true);
  
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
      onLoadingChange(false);
      return;
    }
    
    console.log('[DataLoader] Mês selecionado para busca:', selectedMonth);
    
    const fetchData = async () => {
      if (!isMountedRef.current) return;
      
      try {
        // Start loading
        onLoadingChange(true);
        console.log(`Loading data for month: ${selectedMonth}`);
        
        // Check if data exists in database
        const hasData = await checkMonthData(selectedMonth);
        console.log(`Data exists in database for month ${selectedMonth}: ${hasData}`);
        
        // Return early if component unmounted
        if (!isMountedRef.current) return;
        
        if (hasData) {
          // Load from database
          setLoadingSource("database");
          const dbStudents = await getStudents(selectedMonth);
          
          // Return early if component unmounted
          if (!isMountedRef.current) return;
          
          console.log(`Loaded ${dbStudents.length} students from database for month ${selectedMonth}`);
          console.log("Students data:", dbStudents);
          
          if (dbStudents.length > 0) {
            onDataLoaded(dbStudents, "database");
            toast.success(`Dados carregados do banco de dados`, {
              description: `${dbStudents.length} estudantes para o mês ${selectedMonth}`
            });
          } else {
            toast.info(`Nenhum estudante encontrado no banco para o mês ${selectedMonth}`, {
              description: "Use o botão 'Importar da Planilha' para importar dados"
            });
            onDataLoaded([], "database");
          }
        } else {
          // No data in database
          if (!isMountedRef.current) return;
          
          console.log(`No data in database for month ${selectedMonth}, trying to load anyway...`);
          
          // Try to load students anyway in case the count check failed
          const dbStudents = await getStudents(selectedMonth);
          
          if (dbStudents.length > 0) {
            console.log(`Found ${dbStudents.length} students despite checkMonthData returning false`);
            onDataLoaded(dbStudents, "database");
            toast.success(`Dados carregados do banco de dados`, {
              description: `${dbStudents.length} estudantes para o mês ${selectedMonth}`
            });
          } else {
            toast.info(`Nenhum dado encontrado para o mês ${selectedMonth}`, {
              description: "Use o botão 'Importar da Planilha' para importar dados"
            });
            onDataLoaded([], "");
          }
        }
      } catch (error) {
        // Return early if component unmounted
        if (!isMountedRef.current) return;
        
        console.error("Error loading data:", error);
        toast.error("Erro ao carregar dados", {
          description: "Verifique sua conexão e tente novamente."
        });
        onDataLoaded([], "");
      } finally {
        if (isMountedRef.current) {
          onLoadingChange(false);
          setLoadingSource("");
        }
      }
    };

    // Start fetching data
    fetchData();
  }, [selectedMonth, onDataLoaded, onLoadingChange]);

  // This component doesn't render anything
  return null;
};

export default DataLoader;
