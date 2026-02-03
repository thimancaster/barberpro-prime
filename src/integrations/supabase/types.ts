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
          payment_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
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
          payment_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
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
          payment_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
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
            foreignKeyName: "appointments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
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
      discounts: {
        Row: {
          applies_to: Database["public"]["Enums"]["discount_applies_to"]
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_purchase: number | null
          name: string
          organization_id: string
          times_used: number | null
          type: Database["public"]["Enums"]["discount_type"]
          updated_at: string
          usage_limit: number | null
          valid_from: string | null
          valid_until: string | null
          value: number
        }
        Insert: {
          applies_to?: Database["public"]["Enums"]["discount_applies_to"]
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_purchase?: number | null
          name: string
          organization_id: string
          times_used?: number | null
          type?: Database["public"]["Enums"]["discount_type"]
          updated_at?: string
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
          value: number
        }
        Update: {
          applies_to?: Database["public"]["Enums"]["discount_applies_to"]
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_purchase?: number | null
          name?: string
          organization_id?: string
          times_used?: number | null
          type?: Database["public"]["Enums"]["discount_type"]
          updated_at?: string
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "discounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      loyalty_points: {
        Row: {
          client_id: string
          created_at: string
          id: string
          organization_id: string
          points_balance: number | null
          total_points_earned: number | null
          total_points_redeemed: number | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          organization_id: string
          points_balance?: number | null
          total_points_earned?: number | null
          total_points_redeemed?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          points_balance?: number | null
          total_points_earned?: number | null
          total_points_redeemed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_points_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          points_cost: number
          product_id: string | null
          reward_type: string
          reward_value: number | null
          service_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          points_cost: number
          product_id?: string | null
          reward_type?: string
          reward_value?: number | null
          service_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          points_cost?: number
          product_id?: string | null
          reward_type?: string
          reward_value?: number | null
          service_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_rewards_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_rewards_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_settings: {
        Row: {
          created_at: string
          currency_per_point: number | null
          id: string
          is_active: boolean | null
          min_points_redeem: number | null
          organization_id: string
          points_expiry_days: number | null
          points_per_currency: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_per_point?: number | null
          id?: string
          is_active?: boolean | null
          min_points_redeem?: number | null
          organization_id: string
          points_expiry_days?: number | null
          points_per_currency?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_per_point?: number | null
          id?: string
          is_active?: boolean | null
          min_points_redeem?: number | null
          organization_id?: string
          points_expiry_days?: number | null
          points_per_currency?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          balance_after: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          loyalty_points_id: string
          organization_id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          type: Database["public"]["Enums"]["loyalty_transaction_type"]
        }
        Insert: {
          balance_after: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          loyalty_points_id: string
          organization_id: string
          points: number
          reference_id?: string | null
          reference_type?: string | null
          type: Database["public"]["Enums"]["loyalty_transaction_type"]
        }
        Update: {
          balance_after?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          loyalty_points_id?: string
          organization_id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          type?: Database["public"]["Enums"]["loyalty_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_loyalty_points_id_fkey"
            columns: ["loyalty_points_id"]
            isOneToOne: false
            referencedRelation: "loyalty_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_organization_id_fkey"
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
      notification_logs: {
        Row: {
          appointment_id: string | null
          client_id: string | null
          created_at: string
          delivered_at: string | null
          error_message: string | null
          external_id: string | null
          id: string
          message_content: string
          organization_id: string
          phone_number: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          template_id: string | null
          trigger: Database["public"]["Enums"]["notification_trigger"]
        }
        Insert: {
          appointment_id?: string | null
          client_id?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_content: string
          organization_id: string
          phone_number?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template_id?: string | null
          trigger: Database["public"]["Enums"]["notification_trigger"]
        }
        Update: {
          appointment_id?: string | null
          client_id?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_content?: string
          organization_id?: string
          phone_number?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template_id?: string | null
          trigger?: Database["public"]["Enums"]["notification_trigger"]
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          message_template: string
          name: string
          organization_id: string
          send_via_whatsapp: boolean | null
          trigger: Database["public"]["Enums"]["notification_trigger"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          message_template: string
          name: string
          organization_id: string
          send_via_whatsapp?: boolean | null
          trigger: Database["public"]["Enums"]["notification_trigger"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          message_template?: string
          name?: string
          organization_id?: string
          send_via_whatsapp?: boolean | null
          trigger?: Database["public"]["Enums"]["notification_trigger"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
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
      payment_items: {
        Row: {
          commission_amount: number | null
          commission_percentage: number | null
          created_at: string
          id: string
          item_name: string
          item_type: string
          organization_id: string
          payment_id: string
          product_id: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string
          id?: string
          item_name: string
          item_type?: string
          organization_id: string
          payment_id: string
          product_id?: string | null
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string
          id?: string
          item_name?: string
          item_type?: string
          organization_id?: string
          payment_id?: string
          product_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_items_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          appointment_id: string | null
          barber_id: string | null
          cash_register_id: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          discount_amount: number
          discount_percentage: number | null
          discount_reason: string | null
          id: string
          notes: string | null
          organization_id: string
          payment_details: Json | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          product_commission: number | null
          service_commission: number | null
          subtotal: number
          tip_amount: number
          total_amount: number
          total_commission: number | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          barber_id?: string | null
          cash_register_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          discount_percentage?: number | null
          discount_reason?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          payment_details?: Json | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          product_commission?: number | null
          service_commission?: number | null
          subtotal?: number
          tip_amount?: number
          total_amount?: number
          total_commission?: number | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string | null
          cash_register_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          discount_percentage?: number | null
          discount_reason?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          payment_details?: Json | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          product_commission?: number | null
          service_commission?: number | null
          subtotal?: number
          tip_amount?: number
          total_amount?: number
          total_commission?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      promotions: {
        Row: {
          applies_to: Database["public"]["Enums"]["discount_applies_to"]
          created_at: string
          days_of_week: number[] | null
          description: string | null
          end_time: string | null
          for_new_clients_only: boolean | null
          id: string
          is_active: boolean | null
          min_purchase: number | null
          name: string
          organization_id: string
          priority: number | null
          start_time: string | null
          type: Database["public"]["Enums"]["discount_type"]
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          value: number
        }
        Insert: {
          applies_to?: Database["public"]["Enums"]["discount_applies_to"]
          created_at?: string
          days_of_week?: number[] | null
          description?: string | null
          end_time?: string | null
          for_new_clients_only?: boolean | null
          id?: string
          is_active?: boolean | null
          min_purchase?: number | null
          name: string
          organization_id: string
          priority?: number | null
          start_time?: string | null
          type?: Database["public"]["Enums"]["discount_type"]
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          value: number
        }
        Update: {
          applies_to?: Database["public"]["Enums"]["discount_applies_to"]
          created_at?: string
          days_of_week?: number[] | null
          description?: string | null
          end_time?: string | null
          for_new_clients_only?: boolean | null
          id?: string
          is_active?: boolean | null
          min_purchase?: number | null
          name?: string
          organization_id?: string
          priority?: number | null
          start_time?: string | null
          type?: Database["public"]["Enums"]["discount_type"]
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "promotions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          appointment_id: string | null
          barber_id: string | null
          client_id: string | null
          comment: string | null
          created_at: string
          id: string
          is_public: boolean | null
          nps_score: number | null
          organization_id: string
          rating: number
          response: string | null
          response_at: string | null
          response_by: string | null
          token: string
        }
        Insert: {
          appointment_id?: string | null
          barber_id?: string | null
          client_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          nps_score?: number | null
          organization_id: string
          rating: number
          response?: string | null
          response_at?: string | null
          response_by?: string | null
          token?: string
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string | null
          client_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          nps_score?: number | null
          organization_id?: string
          rating?: number
          response?: string | null
          response_at?: string | null
          response_by?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_response_by_fkey"
            columns: ["response_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          organization_id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
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
      create_public_booking: {
        Args: {
          _barber_id: string
          _client_email?: string
          _client_name: string
          _client_phone: string
          _end_time: string
          _notes?: string
          _org_slug: string
          _service_id: string
          _start_time: string
        }
        Returns: Json
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
      get_public_available_times: {
        Args: {
          _barber_id: string
          _date: string
          _duration_minutes: number
          _org_slug: string
        }
        Returns: Json
      }
      get_public_booking_info: { Args: { _org_slug: string }; Returns: Json }
      get_user_organization_id: { Args: { _user_id: string }; Returns: string }
      has_premium_access: { Args: { _org_id: string }; Returns: boolean }
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
      discount_applies_to: "services" | "products" | "all"
      discount_type: "percentage" | "fixed"
      expense_status: "pending" | "paid"
      loyalty_transaction_type:
        | "earned"
        | "redeemed"
        | "expired"
        | "bonus"
        | "adjustment"
      notification_status: "pending" | "sent" | "delivered" | "failed" | "read"
      notification_trigger:
        | "appointment_created"
        | "appointment_confirmed"
        | "appointment_reminder_1h"
        | "appointment_reminder_24h"
        | "appointment_completed"
        | "review_request"
        | "loyalty_points_earned"
        | "birthday"
      payment_method:
        | "cash"
        | "pix"
        | "credit_card"
        | "debit_card"
        | "voucher"
        | "mixed"
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
      discount_applies_to: ["services", "products", "all"],
      discount_type: ["percentage", "fixed"],
      expense_status: ["pending", "paid"],
      loyalty_transaction_type: [
        "earned",
        "redeemed",
        "expired",
        "bonus",
        "adjustment",
      ],
      notification_status: ["pending", "sent", "delivered", "failed", "read"],
      notification_trigger: [
        "appointment_created",
        "appointment_confirmed",
        "appointment_reminder_1h",
        "appointment_reminder_24h",
        "appointment_completed",
        "review_request",
        "loyalty_points_earned",
        "birthday",
      ],
      payment_method: [
        "cash",
        "pix",
        "credit_card",
        "debit_card",
        "voucher",
        "mixed",
      ],
      service_category: ["cabelo", "barba", "combo", "outros"],
      stock_movement_type: ["entry", "exit", "sale", "adjustment"],
    },
  },
} as const
