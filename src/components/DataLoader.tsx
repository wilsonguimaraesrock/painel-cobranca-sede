
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
    if (!selectedMonth) return;
    
    const fetchData = async () => {
      try {
        onLoadingChange(true);
        console.log(`Carregando dados para o mês: ${selectedMonth}`);
        
        // Verificar se existem dados no banco para este mês
        const hasData = await checkMonthData(selectedMonth);
        console.log(`Dados existentes no banco para o mês ${selectedMonth}: ${hasData}`);
        
        if (hasData) {
          // Carregamos apenas do banco de dados
          setLoadingSource("database");
          const dbStudents = await getStudents(selectedMonth);
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
          toast.info(`Nenhum dado encontrado para o mês ${selectedMonth}`, {
            description: "Você pode usar o botão 'Importar da Planilha' para importar os dados"
          });
          onDataLoaded([], "");
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados", {
          description: "Verifique sua conexão e tente novamente."
        });
        onDataLoaded([], "");
      } finally {
        onLoadingChange(false);
        setLoadingSource("");
      }
    };

    fetchData();
  }, [selectedMonth, onDataLoaded, onLoadingChange]);

  return null; // Este é um componente funcional que não renderiza nada
};

export default DataLoader;
