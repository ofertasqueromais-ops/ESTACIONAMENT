export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      estacionamentos: {
        Row: {
          cnpj: string | null
          created_at: string
          email: string
          endereco: string | null
          horario_funcionamento: string | null
          id: string
          logo_url: string | null
          nome: string
          responsavel: string
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          email: string
          endereco?: string | null
          horario_funcionamento?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          responsavel: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          email?: string
          endereco?: string | null
          horario_funcionamento?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          responsavel?: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mensalistas: {
        Row: {
          created_at: string
          estacionamento_id: string | null
          id: string
          nome: string
          placa: string
          status: string
          telefone: string | null
          updated_at: string
          user_id: string
          valor_mensal: number
          vencimento: string
        }
        Insert: {
          created_at?: string
          estacionamento_id?: string | null
          id?: string
          nome: string
          placa: string
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id: string
          valor_mensal?: number
          vencimento: string
        }
        Update: {
          created_at?: string
          estacionamento_id?: string | null
          id?: string
          nome?: string
          placa?: string
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
          valor_mensal?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensalistas_estacionamento_id_fkey"
            columns: ["estacionamento_id"]
            isOneToOne: false
            referencedRelation: "estacionamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          created_at: string
          data: string
          estacionamento_id: string | null
          forma_pagamento: string
          id: string
          user_id: string
          valor: number
          veiculo_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          estacionamento_id?: string | null
          forma_pagamento: string
          id?: string
          user_id: string
          valor?: number
          veiculo_id: string
        }
        Update: {
          created_at?: string
          data?: string
          estacionamento_id?: string | null
          forma_pagamento?: string
          id?: string
          user_id?: string
          valor?: number
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_estacionamento_id_fkey"
            columns: ["estacionamento_id"]
            isOneToOne: false
            referencedRelation: "estacionamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          created_at: string
          entrada: string
          estacionamento_id: string | null
          id: string
          marca: string | null
          mensalista: boolean
          modelo: string | null
          placa: string
          saida: string | null
          status: string
          tipo: string
          user_id: string
          valor: number | null
        }
        Insert: {
          created_at?: string
          entrada?: string
          estacionamento_id?: string | null
          id?: string
          marca?: string | null
          mensalista?: boolean
          modelo?: string | null
          placa: string
          saida?: string | null
          status?: string
          tipo?: string
          user_id: string
          valor?: number | null
        }
        Update: {
          created_at?: string
          entrada?: string
          estacionamento_id?: string | null
          id?: string
          marca?: string | null
          mensalista?: boolean
          modelo?: string | null
          placa?: string
          saida?: string | null
          status?: string
          tipo?: string
          user_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_estacionamento_id_fkey"
            columns: ["estacionamento_id"]
            isOneToOne: false
            referencedRelation: "estacionamentos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "master" | "mestre"
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
    Enums: {
      app_role: ["admin", "staff", "master", "mestre"],
    },
  },
} as const
