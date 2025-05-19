
import { useState, useEffect } from "react";
import { Student } from "@/types";
import { getSheetData } from "@/lib/googleSheetsApi";
import { saveStudents, getStudents, checkMonthData } from "@/services/supabaseService";
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
        
        // SEMPRE verificar primeiro se existem dados no banco para este mês
        const hasData = await checkMonthData(selectedMonth);
        console.log(`Dados existentes no banco para o mês ${selectedMonth}: ${hasData}`);
        
        if (hasData) {
          // Se existem dados no banco, carregamos APENAS eles
          setLoadingSource("database");
          const dbStudents = await getStudents(selectedMonth);
          console.log(`Carregados ${dbStudents.length} alunos do banco para o mês ${selectedMonth}`);
          
          if (dbStudents.length > 0) {
            onDataLoaded(dbStudents, "database");
            toast.success(`Dados carregados do banco de dados`, {
              description: `${dbStudents.length} alunos para o mês ${selectedMonth}`
            });
          } else {
            // Se o banco retornou vazio (pode ser erro), tentamos carregar da planilha
            await loadFromSheets(selectedMonth);
          }
        } else {
          // Se não existem dados no banco, carregamos da planilha
          await loadFromSheets(selectedMonth);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados", {
          description: "Verifique sua conexão e tente novamente."
        });
      } finally {
        onLoadingChange(false);
        setLoadingSource("");
      }
    };

    // Função auxiliar para carregar dados da planilha do Google
    const loadFromSheets = async (month: string) => {
      try {
        setLoadingSource("sheets");
        const sheetsData = await getSheetData(month);
        
        if (sheetsData.length === 0) {
          toast.error(`Não foram encontrados alunos na planilha para o mês ${month}`);
          return;
        }
        
        console.log(`Carregados ${sheetsData.length} alunos da planilha para o mês ${month}`);
        onDataLoaded(sheetsData, "sheets");
        
        // Salvamos os dados da planilha no banco para uso futuro
        console.log(`Salvando ${sheetsData.length} alunos carregados da planilha no banco de dados...`);
        await saveStudents(sheetsData, month);
        
        toast.success(`Dados carregados da planilha e salvos no banco`, {
          description: `${sheetsData.length} alunos para o mês ${month}`
        });
      } catch (error) {
        console.error("Erro ao carregar e salvar dados da planilha:", error);
        toast.error("Erro ao salvar dados no banco de dados", {
          description: "Os dados foram carregados, mas não foi possível salvá-los."
        });
      }
    };

    fetchData();
  }, [selectedMonth, onDataLoaded, onLoadingChange]);

  return null; // Este é um componente funcional que não renderiza nada
};

export default DataLoader;
