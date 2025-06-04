// Serviço para gerenciar backups locais dos dados
// Última alteração: Criação do serviço de backup

import { supabase } from "@/integrations/supabase/client";
import { Student } from "@/types";
import { toast } from "sonner";

// Função para criar backup local dos dados
export const createLocalBackup = async (mes: string): Promise<void> => {
  try {
    console.log(`Iniciando backup local para o mês ${mes}`);
    
    // Buscar dados do Supabase
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('mes', mes);
    
    if (error) {
      console.error("Erro ao buscar dados para backup:", error);
      throw error;
    }
    
    // Criar objeto de backup com timestamp
    const backup = {
      timestamp: new Date().toISOString(),
      mes,
      data
    };
    
    // Salvar backup no localStorage
    const backupKey = `backup_${mes}_${new Date().getTime()}`;
    localStorage.setItem(backupKey, JSON.stringify(backup));
    
    // Manter apenas os últimos 5 backups
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(`backup_${mes}`))
      .sort()
      .reverse();
    
    if (backupKeys.length > 5) {
      backupKeys.slice(5).forEach(key => localStorage.removeItem(key));
    }
    
    console.log(`Backup local criado com sucesso para o mês ${mes}`);
    toast.success("Backup local criado com sucesso");
  } catch (error) {
    console.error("Erro ao criar backup local:", error);
    toast.error("Erro ao criar backup local");
    throw error;
  }
};

// Função para restaurar backup local
export const restoreLocalBackup = async (mes: string): Promise<Student[]> => {
  try {
    console.log(`Buscando backups locais para o mês ${mes}`);
    
    // Buscar todos os backups do mês
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(`backup_${mes}`))
      .sort()
      .reverse();
    
    if (backupKeys.length === 0) {
      console.log("Nenhum backup local encontrado");
      return [];
    }
    
    // Usar o backup mais recente
    const latestBackup = JSON.parse(localStorage.getItem(backupKeys[0]) || '{}');
    
    if (!latestBackup.data) {
      console.log("Backup local inválido");
      return [];
    }
    
    console.log(`Backup local restaurado com sucesso do mês ${mes}`);
    return latestBackup.data;
  } catch (error) {
    console.error("Erro ao restaurar backup local:", error);
    toast.error("Erro ao restaurar backup local");
    throw error;
  }
};

// Função para listar backups disponíveis
export const listAvailableBackups = (mes: string): { timestamp: string; key: string }[] => {
  const backupKeys = Object.keys(localStorage)
    .filter(key => key.startsWith(`backup_${mes}`))
    .sort()
    .reverse();
  
  return backupKeys.map(key => {
    const backup = JSON.parse(localStorage.getItem(key) || '{}');
    return {
      timestamp: backup.timestamp,
      key
    };
  });
}; 