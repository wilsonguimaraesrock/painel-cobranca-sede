/**
 * 🔐 SERVIÇO DE AUTENTICAÇÃO - Sistema de Cobrança Rockfeller
 * 
 * Implementado em: 18/01/2025
 * Substituiu: Sistema de credenciais hardcoded
 * 
 * Funcionalidades:
 * - Autenticação baseada em banco de dados (Supabase)
 * - Controle de acesso por roles específicos
 * - Validação de usuários ativos
 * - Atualização automática de último login
 */

import { supabase } from '@/config/supabase';

// 🎯 Roles permitidos para acesso ao sistema de cobrança
// Apenas estes perfis podem fazer login na aplicação
const ALLOWED_ROLES = [
  'franqueado',      // Gestão operacional da franquia
  'admin',           // Acesso administrativo total
  'assessora_adm',   // Suporte administrativo
  'supervisor_adm'   // Supervisão e controle
];

export interface AuthUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Autentica usuário usando a tabela user_profiles
 * Permite apenas roles específicos: franqueado, admin, assessora_adm, supervisor_adm
 */
export const authenticateUser = async (credentials: LoginCredentials): Promise<LoginResult> => {
  try {
    const { email, password } = credentials;

    console.log('🔍 Tentativa de login:', { email, password });

    // Primeiro, buscar usuário apenas por email para debug
    const { data: userCheck, error: checkError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    console.log('📋 Usuário encontrado:', userCheck);
    console.log('❗ Erro na busca:', checkError);

    if (checkError || !userCheck) {
      console.log('❌ Usuário não encontrado para email:', email);
      return {
        success: false,
        error: 'Email não encontrado no sistema'
      };
    }

    // Verificar senha
    if (userCheck.password_hash !== password) {
      console.log('❌ Senha incorreta. Esperado:', userCheck.password_hash, 'Recebido:', password);
      return {
        success: false,
        error: 'Senha incorreta'
      };
    }

    // Agora buscar com email e senha para confirmar
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .eq('password_hash', password)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      console.log('❌ Erro na consulta final:', error);
      return {
        success: false,
        error: 'Email ou senha inválidos'
      };
    }

    // Verificar se o role está na lista de permitidos
    if (!ALLOWED_ROLES.includes(user.role)) {
      console.log(`Role não permitido: ${user.role}`);
      return {
        success: false,
        error: 'Acesso não autorizado para este sistema'
      };
    }

    // Atualizar último login
    await supabase
      .from('user_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    return {
      success: true,
      user: {
        id: user.id,
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      }
    };

  } catch (error) {
    console.error('Erro na autenticação:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
};

/**
 * Verifica se um role tem permissão para acessar o sistema
 */
export const isRoleAllowed = (role: string): boolean => {
  return ALLOWED_ROLES.includes(role);
};

/**
 * Obtém a lista de roles permitidos
 */
export const getAllowedRoles = (): string[] => {
  return [...ALLOWED_ROLES];
};

/**
 * Formata o nome do role para exibição
 */
export const formatRoleName = (role: string): string => {
  const roleNames: Record<string, string> = {
    franqueado: 'Franqueado',
    admin: 'Administrador',
    assessora_adm: 'Assessora Administrativa',
    supervisor_adm: 'Supervisora Administrativa'
  };
  
  return roleNames[role] || role;
}; 