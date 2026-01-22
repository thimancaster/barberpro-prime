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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          barber_id: string | null
          client_id: string | null
          commission_amount: number | null
          created_at: string
          end_time: string
          id: string
          notes: string | null
          organization_id: string
          price: number
          service_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          updated_at: string
        }
        Insert: {
          barber_id?: string | null
          client_id?: string | null
          commission_amount?: number | null
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          organization_id: string
          price: number
          service_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string
        }
        Update: {
          barber_id?: string | null
          client_id?: string | null
          commission_amount?: number | null
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          organization_id?: string
          price?: number
          service_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          amount: number
          cash_register_id: string
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          organization_id: string
          reference_id: string | null
          reference_type: string | null
          type: string
        }
        Insert: {
          amount: number
          cash_register_id: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id: string
          reference_id?: string | null
          reference_type?: string | null
          type: string
        }
        Update: {
          amount?: number
          cash_register_id?: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_registers: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          closing_amount: number | null
          difference: number | null
          expected_amount: number | null
          id: string
          notes: string | null
          opened_at: string
          opened_by: string
          opening_amount: number
          organization_id: string
          status: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          closing_amount?: number | null
          difference?: number | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by: string
          opening_amount?: number
          organization_id: string
          status?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          closing_amount?: number | null
          difference?: number | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string
          opening_amount?: number
          organization_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_registers_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_registers_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_registers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_visit_at: string | null
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          total_spent: number | null
          total_visits: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          last_visit_at?: string | null
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          total_spent?: number | null
          total_visits?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_visit_at?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          total_spent?: number | null
          total_visits?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_payments: {
        Row: {
          appointments_count: number | null
          barber_id: string
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          paid_at: string | null
          paid_by: string | null
          period_end: string
          period_start: string
          products_count: number | null
          status: string
          total_commission: number
          total_products: number | null
          total_services: number | null
        }
        Insert: {
          appointments_count?: number | null
          barber_id: string
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          paid_by?: string | null
          period_end: string
          period_start: string
          products_count?: number | null
          status?: string
          total_commission: number
          total_products?: number | null
          total_services?: number | null
        }
        Update: {
          appointments_count?: number | null
          barber_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          paid_by?: string | null
          period_end?: string
          period_start?: string
          products_count?: number | null
          status?: string
          total_commission?: number
          total_products?: number | null
          total_services?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_payments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payments_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_recurring: boolean | null
          name: string
          organization_id: string
          paid_at: string | null
          parent_expense_id: string | null
          recurrence_day: number | null
          recurrence_type: string | null
          status: Database["public"]["Enums"]["expense_status"] | null
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          name: string
          organization_id: string
          paid_at?: string | null
          parent_expense_id?: string | null
          recurrence_day?: number | null
          recurrence_type?: string | null
          status?: Database["public"]["Enums"]["expense_status"] | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          name?: string
          organization_id?: string
          paid_at?: string | null
          parent_expense_id?: string | null
          recurrence_day?: number | null
          recurrence_type?: string | null
          status?: Database["public"]["Enums"]["expense_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_parent_expense_id_fkey"
            columns: ["parent_expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string | null
          email: string | null
          expires_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"] | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"] | null
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_integrations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          last_test_at: string | null
          last_test_success: boolean | null
          organization_id: string
          updated_at: string
          webhook_url: string | null
          whatsapp_instance_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_test_at?: string | null
          last_test_success?: boolean | null
          organization_id: string
          updated_at?: string
          webhook_url?: string | null
          whatsapp_instance_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_test_at?: string | null
          last_test_success?: boolean | null
          organization_id?: string
          updated_at?: string
          webhook_url?: string | null
          whatsapp_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "n8n_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          closing_time: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          opening_time: string | null
          phone: string | null
          slug: string
          updated_at: string
          working_days: number[] | null
        }
        Insert: {
          address?: string | null
          closing_time?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          opening_time?: string | null
          phone?: string | null
          slug: string
          updated_at?: string
          working_days?: number[] | null
        }
        Update: {
          address?: string | null
          closing_time?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          opening_time?: string | null
          phone?: string | null
          slug?: string
          updated_at?: string
          working_days?: number[] | null
        }
        Relationships: []
      }
      product_sales: {
        Row: {
          barber_id: string | null
          cash_register_id: string | null
          client_id: string | null
          commission_amount: number | null
          commission_percentage: number | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          barber_id?: string | null
          cash_register_id?: string | null
          client_id?: string | null
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          product_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          barber_id?: string | null
          cash_register_id?: string | null
          client_id?: string | null
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_sales_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          min_quantity: number | null
          name: string
          organization_id: string
          quantity: number | null
          sale_price: number
          updated_at: string
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_quantity?: number | null
          name: string
          organization_id: string
          quantity?: number | null
          sale_price: number
          updated_at?: string
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_quantity?: number | null
          name?: string
          organization_id?: string
          quantity?: number | null
          sale_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          commission_percentage: number | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean | null
          organization_id: string | null
          phone: string | null
          product_commission_percentage: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          commission_percentage?: number | null
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean | null
          organization_id?: string | null
          phone?: string | null
          product_commission_percentage?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          commission_percentage?: number | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          phone?: string | null
          product_commission_percentage?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: Database["public"]["Enums"]["service_category"] | null
          commission_percentage: number | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          price: number
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["service_category"] | null
          commission_percentage?: number | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          price: number
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["service_category"] | null
          commission_percentage?: number | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          new_quantity: number
          organization_id: string
          previous_quantity: number
          product_id: string
          quantity: number
          reason: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_quantity: number
          organization_id: string
          previous_quantity: number
          product_id: string
          quantity: number
          reason?: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_quantity?: number
          organization_id?: string
          previous_quantity?: number
          product_id?: string
          quantity?: number
          reason?: string | null
          type?: Database["public"]["Enums"]["stock_movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      working_hours: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_working: boolean | null
          profile_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_working?: boolean | null
          profile_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_working?: boolean | null
          profile_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: {
        Args: { _full_name: string; _token: string }
        Returns: undefined
      }
      create_organization: {
        Args: {
          _closing_time?: string
          _opening_time?: string
          _org_address?: string
          _org_email?: string
          _org_name: string
          _org_phone?: string
          _org_slug: string
          _user_full_name?: string
          _user_phone?: string
        }
        Returns: string
      }
      get_invite_public: {
        Args: { _token: string }
        Returns: {
          accepted_at: string
          expires_at: string
          id: string
          organization_id: string
          organization_name: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      get_user_organization_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      user_belongs_to_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "barber"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      expense_status: "pending" | "paid"
      service_category: "cabelo" | "barba" | "combo" | "outros"
      stock_movement_type: "entry" | "exit" | "sale" | "adjustment"
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
      app_role: ["admin", "barber"],
      appointment_status: [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      expense_status: ["pending", "paid"],
      service_category: ["cabelo", "barba", "combo", "outros"],
      stock_movement_type: ["entry", "exit", "sale", "adjustment"],
    },
  },
} as const
