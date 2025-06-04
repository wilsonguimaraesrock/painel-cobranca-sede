// Configuração do Supabase
// Última alteração: Criação do arquivo de configuração

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Configurações do Supabase
const SUPABASE_URL = "https://olhdcicquehastcwvieu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9saGRjaWNxdWVoYXN0Y3d2aWV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2NzI5MDksImV4cCI6MjA2MzI0ODkwOX0.hRmOjxiNQ_p5HFeFjpboHW6jV-Dkki2NWfmL6GyUcBU";

// Criar cliente do Supabase com configurações personalizadas
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'crm-cobranca'
    }
  }
});

// Funções de utilidade para o Supabase
export const supabaseUtils = {
  // Verificar se há erro de permissão
  isPermissionError: (error: any) => error?.code === "42501",
  
  // Verificar se há erro de conexão
  isConnectionError: (error: any) => {
    return error?.code === "ECONNREFUSED" || 
           error?.code === "ETIMEDOUT" || 
           error?.message?.includes("network");
  },
  
  // Verificar se há erro de autenticação
  isAuthError: (error: any) => {
    return error?.code === "401" || 
           error?.message?.includes("auth") ||
           error?.message?.includes("unauthorized");
  },
  
  // Tratar erro do Supabase
  handleError: (error: any) => {
    console.error("Erro do Supabase:", error);
    
    if (supabaseUtils.isPermissionError(error)) {
      return {
        message: "Erro de permissão no banco de dados",
        description: "Contate o administrador para configurar as políticas de acesso."
      };
    }
    
    if (supabaseUtils.isConnectionError(error)) {
      return {
        message: "Erro de conexão com o banco de dados",
        description: "Verifique sua conexão com a internet e tente novamente."
      };
    }
    
    if (supabaseUtils.isAuthError(error)) {
      return {
        message: "Erro de autenticação",
        description: "Sua sessão pode ter expirado. Tente recarregar a página."
      };
    }
    
    return {
      message: "Erro no banco de dados",
      description: "Ocorreu um erro inesperado. Tente novamente mais tarde."
    };
  }
}; 