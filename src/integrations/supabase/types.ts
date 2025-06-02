export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
