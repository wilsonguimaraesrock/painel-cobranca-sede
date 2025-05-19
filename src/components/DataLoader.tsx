
import { useState, useEffect } from "react";
import { Student } from "@/types";
import { getStudents, checkMonthData } from "@/services/supabaseService";
import { toast } from "sonner";

interface DataLoaderProps {
  selectedMonth: string;
  onDataLoaded: (students: Student[], source: "sheets" | "database" | "") => void;
  onLoadingChange: (loading: boolean) => void;
}

const DataLoader = ({ selectedMonth, onDataLoaded, onLoadingChange }: DataLoaderProps) => {
  const [loadingSource, setLoadingSource] = useState<"sheets" | "database" | "">("");

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!selectedMonth) return;
      
      try {
        onLoadingChange(true);
        console.log(`Carregando dados para o mês: ${selectedMonth}`);
        
        // Verificar se existem dados no banco para este mês
        const hasData = await checkMonthData(selectedMonth);
        console.log(`Dados existentes no banco para o mês ${selectedMonth}: ${hasData}`);
        
        if (!isMounted) return;
        
        if (hasData) {
          // Carregamos apenas do banco de dados
          setLoadingSource("database");
          const dbStudents = await getStudents(selectedMonth);
          
          if (!isMounted) return;
          
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
          if (!isMounted) return;
          
          toast.info(`Nenhum dado encontrado para o mês ${selectedMonth}`, {
            description: "Você pode usar o botão 'Importar da Planilha' para importar os dados"
          });
          onDataLoaded([], "");
        }
      } catch (error) {
        if (!isMounted) return;
        
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados", {
          description: "Verifique sua conexão e tente novamente."
        });
        onDataLoaded([], "");
      } finally {
        if (isMounted) {
          onLoadingChange(false);
          setLoadingSource("");
        }
      }
    };

    fetchData();
    
    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted = false;
    };
  }, [selectedMonth, onDataLoaded, onLoadingChange]);

  return null;
};

export default DataLoader;
