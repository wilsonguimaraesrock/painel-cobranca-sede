export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      available_months: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          month_value: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          month_value: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          month_value?: string
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          ativo: boolean
          cargo: string
          datacadastro: string
          departamento: string
          email: string | null
          foto: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          cargo: string
          datacadastro?: string
          departamento: string
          email?: string | null
          foto?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          cargo?: string
          datacadastro?: string
          departamento?: string
          email?: string | null
          foto?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      horarios: {
        Row: {
          created_at: string | null
          data: string
          funcionarioid: string
          horaentrada1: string | null
          horaentrada2: string | null
          horasaida1: string | null
          horasaida2: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          data: string
          funcionarioid: string
          horaentrada1?: string | null
          horaentrada2?: string | null
          horasaida1?: string | null
          horasaida2?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          data?: string
          funcionarioid?: string
          horaentrada1?: string | null
          horaentrada2?: string | null
          horasaida1?: string | null
          horasaida2?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "horarios_funcionarioid_fkey"
            columns: ["funcionarioid"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      status_history: {
        Row: {
          changed_at: string | null
          changed_by: string
          id: string
          new_status: string
          old_status: string
          student_id: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by: string
          id?: string
          new_status: string
          old_status: string
          student_id?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string
          id?: string
          new_status?: string
          old_status?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "status_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string | null
          curso: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          dias_atraso: number | null
          email: string | null
          follow_up: string | null
          id: string
          mes: string
          nome: string
          observacoes: string | null
          primeiro_contato: string | null
          status: string
          telefone: string | null
          ultimo_contato: string | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          created_at?: string | null
          curso?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          dias_atraso?: number | null
          email?: string | null
          follow_up?: string | null
          id?: string
          mes: string
          nome: string
          observacoes?: string | null
          primeiro_contato?: string | null
          status?: string
          telefone?: string | null
          ultimo_contato?: string | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          created_at?: string | null
          curso?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          dias_atraso?: number | null
          email?: string | null
          follow_up?: string | null
          id?: string
          mes?: string
          nome?: string
          observacoes?: string | null
          primeiro_contato?: string | null
          status?: string
          telefone?: string | null
          ultimo_contato?: string | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_users: string[] | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          edited_at: string | null
          edited_by: string | null
          id: string
          is_private: boolean
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_users?: string[] | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          is_private?: boolean
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_users?: string[] | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          is_private?: boolean
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string
          first_login_completed: boolean
          id: string
          is_active: boolean
          last_login: string | null
          name: string
          password_hash: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_login_completed?: boolean
          id?: string
          is_active?: boolean
          last_login?: string | null
          name: string
          password_hash?: string | null
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_login_completed?: boolean
          id?: string
          is_active?: boolean
          last_login?: string | null
          name?: string
          password_hash?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_visible_users_for_role: {
        Args: { user_role: string }
        Returns: {
          user_id: string
          name: string
          email: string
          role: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
