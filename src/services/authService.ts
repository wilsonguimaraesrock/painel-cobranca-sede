import { supabase } from '@/config/supabase';

// Roles permitidos para login no sistema de cobrança
const ALLOWED_ROLES = [
  'franqueado',
  'admin', 
  'assessora_adm',
  'supervisor_adm'
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

    // Buscar usuário na tabela user_profiles
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .eq('password_hash', password)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      console.log('Usuário não encontrado ou credenciais inválidas:', error);
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