
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
  // Move all hooks to the top
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
    if (!selectedMonth) {
      onLoadingChange(false);
      return;
    }
    
    const fetchData = async () => {
      try {
        onLoadingChange(true);
        console.log(`Carregando dados para o mês: ${selectedMonth}`);
        
        // Check if data exists in the database for this month
        const hasData = await checkMonthData(selectedMonth);
        console.log(`Dados existentes no banco para o mês ${selectedMonth}: ${hasData}`);
        
        // Return early if component unmounted
        if (!isMountedRef.current) return;
        
        if (hasData) {
          // Load only from database
          setLoadingSource("database");
          const dbStudents = await getStudents(selectedMonth);
          
          // Return early if component unmounted
          if (!isMountedRef.current) return;
          
          console.log(`Carregados ${dbStudents.length} alunos do banco para o mês ${selectedMonth}`);
          
          if (dbStudents.length > 0) {
            onDataLoaded(dbStudents, "database");
            toast.success(`Dados carregados do banco de dados`, {
              description: `${dbStudents.length} alunos para o mês ${selectedMonth}`
            });
          } else {
            toast.info(`Nenhum aluno encontrado no banco de dados para o mês ${selectedMonth}`, {
              description: "Você pode usar o botão 'Importar da Planilha' para importar os dados"
            });
            onDataLoaded([], "database");
          }
        } else {
          // Return early if component unmounted
          if (!isMountedRef.current) return;
          
          toast.info(`Nenhum dado encontrado para o mês ${selectedMonth}`, {
            description: "Você pode usar o botão 'Importar da Planilha' para importar os dados"
          });
          onDataLoaded([], "");
        }
      } catch (error) {
        // Return early if component unmounted
        if (!isMountedRef.current) return;
        
        console.error("Erro ao carregar dados:", error);
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

    fetchData();
  }, [selectedMonth, onDataLoaded, onLoadingChange]);

  return null;
};

export default DataLoader;
