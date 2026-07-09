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
      app_settings: {
        Row: {
          id: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          id: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          id?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      customers: {
        Row: {
          contact: string | null
          created_at: string
          id: string
          is_active: boolean | null
          location: string | null
          name: string | null
          seller_id: number | null
        }
        Insert: {
          contact?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string | null
          seller_id?: number | null
        }
        Update: {
          contact?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string | null
          seller_id?: number | null
        }
        Relationships: []
      }
      global_pricing: {
        Row: {
          buffalo_price: number
          cow_price: number
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          buffalo_price?: number
          cow_price?: number
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          buffalo_price?: number
          cow_price?: number
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      live_cycle_aggregates: {
        Row: {
          created_at: string | null
          customer_id: string
          cycle_end_date: string
          cycle_identifier: string
          cycle_start_date: string
          evening_shifts_count: number | null
          id: string
          last_transaction_date: string | null
          morning_shifts_count: number | null
          total_buffalo_litres: number | null
          total_cow_litres: number | null
          total_earnings: number | null
          total_litres: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          cycle_end_date: string
          cycle_identifier: string
          cycle_start_date: string
          evening_shifts_count?: number | null
          id?: string
          last_transaction_date?: string | null
          morning_shifts_count?: number | null
          total_buffalo_litres?: number | null
          total_cow_litres?: number | null
          total_earnings?: number | null
          total_litres?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          cycle_end_date?: string
          cycle_identifier?: string
          cycle_start_date?: string
          evening_shifts_count?: number | null
          id?: string
          last_transaction_date?: string | null
          morning_shifts_count?: number | null
          total_buffalo_litres?: number | null
          total_cow_litres?: number | null
          total_earnings?: number | null
          total_litres?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_cycle_aggregates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_payments: {
        Row: {
          created_at: string | null
          cycle_identifier: string | null
          id: string
          interest_paid: number | null
          loan_id: string
          payment_date: string
          principal_paid: number | null
          source: string
        }
        Insert: {
          created_at?: string | null
          cycle_identifier?: string | null
          id?: string
          interest_paid?: number | null
          loan_id: string
          payment_date?: string
          principal_paid?: number | null
          source?: string
        }
        Update: {
          created_at?: string | null
          cycle_identifier?: string | null
          id?: string
          interest_paid?: number | null
          loan_id?: string
          payment_date?: string
          principal_paid?: number | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          interest_rate_rupees: number
          loan_date: string
          principal_amount: number
          status: string
          total_interest_paid: number | null
          total_principal_paid: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          interest_rate_rupees: number
          loan_date?: string
          principal_amount: number
          status?: string
          total_interest_paid?: number | null
          total_principal_paid?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          interest_rate_rupees?: number
          loan_date?: string
          principal_amount?: number
          status?: string
          total_interest_paid?: number | null
          total_principal_paid?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          created_at: string | null
          customer_id: string
          cycle_end_date: string
          cycle_identifier: string
          cycle_start_date: string
          id: string
          loan_interest_deducted: number | null
          loan_principal_deducted: number | null
          net_payable: number | null
          payout_date: string
          status: string
          total_earnings: number | null
          total_milk_litres: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          cycle_end_date: string
          cycle_identifier: string
          cycle_start_date: string
          id?: string
          loan_interest_deducted?: number | null
          loan_principal_deducted?: number | null
          net_payable?: number | null
          payout_date: string
          status?: string
          total_earnings?: number | null
          total_milk_litres?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          cycle_end_date?: string
          cycle_identifier?: string
          cycle_start_date?: string
          id?: string
          loan_interest_deducted?: number | null
          loan_principal_deducted?: number | null
          net_payable?: number | null
          payout_date?: string
          status?: string
          total_earnings?: number | null
          total_milk_litres?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          id: string
          role: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      settings_audit: {
        Row: {
          id: string
          new_value: Json | null
          old_value: Json | null
          setting_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          setting_name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          setting_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          buffalo_price: number
          cow_price: number
          id: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          buffalo_price?: number
          cow_price?: number
          id: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          buffalo_price?: number
          cow_price?: number
          id?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_name: string | null
          customer_id: string
          fat_percentage: number
          id: string
          milk_type: string
          price_per_litre: number
          quantity_litres: number
          shift: string
          total_price: number
          transaction_date: string
          updated_at: string | null
          updated_by: string | null
          updated_by_name: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          customer_id: string
          fat_percentage?: number
          id?: string
          milk_type: string
          price_per_litre: number
          quantity_litres: number
          shift?: string
          total_price: number
          transaction_date?: string
          updated_at?: string | null
          updated_by?: string | null
          updated_by_name?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          customer_id?: string
          fat_percentage?: number
          id?: string
          milk_type?: string
          price_per_litre?: number
          quantity_litres?: number
          shift?: string
          total_price?: number
          transaction_date?: string
          updated_at?: string | null
          updated_by?: string | null
          updated_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_transaction_safe: {
        Args: { p_transaction_id: string }
        Returns: undefined
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
