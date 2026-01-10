export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
          barber_id: string | null
          created_at: string
          id: string
          lead_id: string
          notes: string | null
          scheduled_at: string
          service_id: string
          status: string
          updated_at: string
        }
        Insert: {
          barber_id?: string | null
          created_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          scheduled_at: string
          service_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          barber_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          scheduled_at?: string
          service_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      commissions: {
        Row: {
          amount: number
          appointment_id: string | null
          barber_id: string | null
          created_at: string | null
          id: string
          service_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          barber_id?: string | null
          created_at?: string | null
          id?: string
          service_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          barber_id?: string | null
          created_at?: string | null
          id?: string
          service_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_appointment_id_fkey"
            columns: ["appointment_id"]
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_barber_id_fkey"
            columns: ["barber_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_service_id_fkey"
            columns: ["service_id"]
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: {
          channel: string
          created_at: string
          external_id: string | null
          id: string
          lead_id: string
          status: string
          updated_at: string
        }
        Insert: {
          channel?: string
          created_at?: string
          external_id?: string | null
          id?: string
          lead_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          external_id?: string | null
          id?: string
          lead_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            referencedRelation: "leads"
            referencedColumns: ["id"]
          }
        ]
      }
      custom_pipelines: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          name: string
          on_completion_action: string
          on_completion_target_pipeline: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          on_completion_action?: string
          on_completion_target_pipeline?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          on_completion_action?: string
          on_completion_target_pipeline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          description: string
          due_date: string | null
          id: string
          paid_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_tags: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tags_lead_id_fkey"
            columns: ["lead_id"]
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tags_tag_id_fkey"
            columns: ["tag_id"]
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string | null
          estimated_budget: number | null
          id: string
          last_contact_at: string | null
          lead_score: number
          main_pain: string | null
          name: string | null
          notes: string | null
          pipeline_id: string | null
          pipeline_stage_id: string | null
          preferred_barber: string | null
          source: string | null
          stage: string
          subscription_expires_at: string | null
          subscription_plan: string | null
          subscription_started_at: string | null
          subscription_status: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          estimated_budget?: number | null
          id?: string
          last_contact_at?: string | null
          lead_score?: number
          main_pain?: string | null
          name?: string | null
          notes?: string | null
          pipeline_id?: string | null
          pipeline_stage_id?: string | null
          preferred_barber?: string | null
          source?: string | null
          stage?: string
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          estimated_budget?: number | null
          id?: string
          last_contact_at?: string | null
          lead_score?: number
          main_pain?: string | null
          name?: string | null
          notes?: string | null
          pipeline_id?: string | null
          pipeline_stage_id?: string | null
          preferred_barber?: string | null
          source?: string | null
          stage?: string
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_pipeline_id_fkey"
            columns: ["pipeline_id"]
            referencedRelation: "custom_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_pipeline_stage_id_fkey"
            columns: ["pipeline_stage_id"]
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          backend_log: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          backend_log?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          backend_log?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      order_items: {
        Row: {
          barber_id: string | null
          created_at: string | null
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number | null
          service_id: string | null
          unit_price: number
        }
        Insert: {
          barber_id?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number | null
          service_id?: string | null
          unit_price: number
        }
        Update: {
          barber_id?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number | null
          service_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_barber_id_fkey"
            columns: ["barber_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_service_id_fkey"
            columns: ["service_id"]
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_name: string | null
          id: string
          lead_id: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          id?: string
          lead_id?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          id?: string
          lead_id?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_lead_id_fkey"
            columns: ["lead_id"]
            referencedRelation: "leads"
            referencedColumns: ["id"]
          }
        ]
      }
      pipeline_stages: {
        Row: {
          ai_prompt: string | null
          color: string | null
          created_at: string
          description: string | null
          display_order: number
          final_type: string | null
          id: string
          is_final: boolean
          name: string
          pipeline_id: string
          updated_at: string
        }
        Insert: {
          ai_prompt?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          final_type?: string | null
          id?: string
          is_final?: boolean
          name: string
          pipeline_id: string
          updated_at?: string
        }
        Update: {
          ai_prompt?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          final_type?: string | null
          id?: string
          is_final?: boolean
          name?: string
          pipeline_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            referencedRelation: "custom_pipelines"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          stock_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          commission_percentage: number | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number
        }
        Insert: {
          commission_percentage?: number | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          price: number
        }
        Update: {
          commission_percentage?: number | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
        }
        Relationships: []
      }
      stage_automations: {
        Row: {
          action_config: Json | null
          action_type: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          stage_id: string
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          stage_id: string
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          action_config?: Json | null
          action_type: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          stage_id?: string
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_automations_stage_id_fkey"
            columns: ["stage_id"]
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          }
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          id: string
          is_active: boolean
          name: string
          price: number
          services_included: string[] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean
          name: string
          price: number
          services_included?: string[] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          services_included?: string[] | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          lead_id: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id: string
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            referencedRelation: "leads"
            referencedColumns: ["id"]
          }
        ]
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
