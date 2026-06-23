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
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nama: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nama: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nama?: string
          updated_at?: string
        }
        Relationships: []
      }
      tarif: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kategori: string
          nama: string
          tarif: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kategori?: string
          nama: string
          tarif?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kategori?: string
          nama?: string
          tarif?: number
          updated_at?: string
        }
        Relationships: []
      }
      transaksi: {
        Row: {
          catatan: string | null
          created_at: string
          created_by: string | null
          id: string
          jumlah: number
          subtotal: number
          tanggal: string
          tarif_id: string
          tarif_nominal: number
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          jumlah?: number
          subtotal?: number
          tanggal?: string
          tarif_id: string
          tarif_nominal?: number
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          jumlah?: number
          subtotal?: number
          tanggal?: string
          tarif_id?: string
          tarif_nominal?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaksi_tarif_id_fkey"
            columns: ["tarif_id"]
            isOneToOne: false
            referencedRelation: "tarif"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_tarif_id_fkey"
            columns: ["tarif_id"]
            isOneToOne: false
            referencedRelation: "tarif_public"
            referencedColumns: ["id"]
          },
        ]
      }
      transaksi_bidan: {
        Row: {
          bidan_id: string
          transaksi_id: string
        }
        Insert: {
          bidan_id: string
          transaksi_id: string
        }
        Update: {
          bidan_id?: string
          transaksi_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaksi_bidan_bidan_id_fkey"
            columns: ["bidan_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_bidan_transaksi_id_fkey"
            columns: ["transaksi_id"]
            isOneToOne: false
            referencedRelation: "transaksi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_bidan_transaksi_id_fkey"
            columns: ["transaksi_id"]
            isOneToOne: false
            referencedRelation: "transaksi_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      tarif_public: {
        Row: {
          created_at: string | null
          id: string | null
          kategori: string | null
          nama: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          kategori?: string | null
          nama?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          kategori?: string | null
          nama?: string | null
        }
        Relationships: []
      }
      transaksi_public: {
        Row: {
          catatan: string | null
          created_at: string | null
          created_by: string | null
          id: string | null
          jumlah: number | null
          tanggal: string | null
          tarif_id: string | null
        }
        Insert: {
          catatan?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          jumlah?: number | null
          tanggal?: string | null
          tarif_id?: string | null
        }
        Update: {
          catatan?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          jumlah?: number | null
          tanggal?: string | null
          tarif_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaksi_tarif_id_fkey"
            columns: ["tarif_id"]
            isOneToOne: false
            referencedRelation: "tarif"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_tarif_id_fkey"
            columns: ["tarif_id"]
            isOneToOne: false
            referencedRelation: "tarif_public"
            referencedColumns: ["id"]
          },
        ]
      }
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
      app_role: "owner" | "bidan"
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
      app_role: ["owner", "bidan"],
    },
  },
} as const
