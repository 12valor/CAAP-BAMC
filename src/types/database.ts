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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      account_usernames: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          id: string
          internal_auth_identifier: string
          last_successful_login_at: string | null
          profile_id: string
          updated_at: string
          updated_by: string | null
          username: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          id?: string
          internal_auth_identifier: string
          last_successful_login_at?: string | null
          profile_id: string
          updated_at?: string
          updated_by?: string | null
          username: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          id?: string
          internal_auth_identifier?: string
          last_successful_login_at?: string | null
          profile_id?: string
          updated_at?: string
          updated_by?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_usernames_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_usernames_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_usernames_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_usernames_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_profile_id: string | null
          entity_id: string
          entity_table: string
          id: number
          metadata: Json
          new_data: Json | null
          occurred_at: string
          old_data: Json | null
          reason: string | null
          request_id: string | null
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          entity_id: string
          entity_table: string
          id?: never
          metadata?: Json
          new_data?: Json | null
          occurred_at?: string
          old_data?: Json | null
          reason?: string | null
          request_id?: string | null
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          entity_id?: string
          entity_table?: string
          id?: never
          metadata?: Json
          new_data?: Json | null
          occurred_at?: string
          old_data?: Json | null
          reason?: string | null
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_categories: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string | null
          employee_visible_default: boolean
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          employee_visible_default?: boolean
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          employee_visible_default?: boolean
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_categories_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_categories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          document_category_id: string
          document_date: string | null
          employee_id: string
          id: string
          is_employee_visible: boolean
          metadata: Json
          mime_type: string
          original_filename: string
          size_bytes: number
          status: string
          storage_object_path: string
          updated_at: string
          updated_by: string | null
          upload_attempts: number
          upload_error: string | null
          uploaded_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          document_category_id: string
          document_date?: string | null
          employee_id: string
          id?: string
          is_employee_visible?: boolean
          metadata?: Json
          mime_type: string
          original_filename: string
          size_bytes: number
          status?: string
          storage_object_path: string
          updated_at?: string
          updated_by?: string | null
          upload_attempts?: number
          upload_error?: string | null
          uploaded_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          document_category_id?: string
          document_date?: string | null
          employee_id?: string
          id?: string
          is_employee_visible?: boolean
          metadata?: Json
          mime_type?: string
          original_filename?: string
          size_bytes?: number
          status?: string
          storage_object_path?: string
          updated_at?: string
          updated_by?: string | null
          upload_attempts?: number
          upload_error?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_document_category_id_fkey"
            columns: ["document_category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_profiles: {
        Row: {
          address_text: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          department: string | null
          email_address: string | null
          employee_number: string
          employment_category: string
          employment_status: string
          first_name: string
          hire_date: string | null
          id: string
          last_name: string
          middle_name: string | null
          mobile_number: string | null
          notes: string | null
          position_title: string | null
          profile_id: string | null
          search_text: string | null
          separation_date: string | null
          suffix: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address_text?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          department?: string | null
          email_address?: string | null
          employee_number: string
          employment_category?: string
          employment_status?: string
          first_name: string
          hire_date?: string | null
          id?: string
          last_name: string
          middle_name?: string | null
          mobile_number?: string | null
          notes?: string | null
          position_title?: string | null
          profile_id?: string | null
          search_text?: string | null
          separation_date?: string | null
          suffix?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address_text?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          department?: string | null
          email_address?: string | null
          employee_number?: string
          employment_category?: string
          employment_status?: string
          first_name?: string
          hire_date?: string | null
          id?: string
          last_name?: string
          middle_name?: string | null
          mobile_number?: string | null
          notes?: string | null
          position_title?: string | null
          profile_id?: string | null
          search_text?: string | null
          separation_date?: string | null
          suffix?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_profiles_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_profiles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_categories: {
        Row: {
          balance_effect: string
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          balance_effect?: string
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          balance_effect?: string
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_categories_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_categories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          error_rows: number
          id: string
          import_type: string
          source_digest: string | null
          source_filename: string
          started_at: string | null
          status: string
          storage_object_path: string | null
          summary: Json
          total_rows: number
          updated_at: string
          updated_by: string | null
          valid_rows: number
        }
        Insert: {
          completed_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          error_rows?: number
          id?: string
          import_type: string
          source_digest?: string | null
          source_filename: string
          started_at?: string | null
          status?: string
          storage_object_path?: string | null
          summary?: Json
          total_rows?: number
          updated_at?: string
          updated_by?: string | null
          valid_rows?: number
        }
        Update: {
          completed_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          error_rows?: number
          id?: string
          import_type?: string
          source_digest?: string | null
          source_filename?: string
          started_at?: string | null
          status?: string
          storage_object_path?: string | null
          summary?: Json
          total_rows?: number
          updated_at?: string
          updated_by?: string | null
          valid_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_jobs_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_jobs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_rows: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          entity_type: string | null
          error_code: string | null
          error_details: Json | null
          error_message: string | null
          id: string
          import_job_id: string
          normalized_data: Json | null
          processed_at: string | null
          row_number: number
          source_data: Json
          status: string
          target_record_id: string | null
          target_table: string | null
          updated_at: string
          updated_by: string | null
          warning_message: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          entity_type?: string | null
          error_code?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          import_job_id: string
          normalized_data?: Json | null
          processed_at?: string | null
          row_number: number
          source_data?: Json
          status?: string
          target_record_id?: string | null
          target_table?: string | null
          updated_at?: string
          updated_by?: string | null
          warning_message?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          entity_type?: string | null
          error_code?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          import_job_id?: string
          normalized_data?: Json | null
          processed_at?: string | null
          row_number?: number
          source_data?: Json
          status?: string
          target_record_id?: string | null
          target_table?: string | null
          updated_at?: string
          updated_by?: string | null
          warning_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_rows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_rows_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_rows_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_rows_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interest_methods: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          default_rate: number | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          is_active: boolean
          name: string
          strategy: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          default_rate?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          is_active?: boolean
          name: string
          strategy?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          default_rate?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          is_active?: boolean
          name?: string
          strategy?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interest_methods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interest_methods_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interest_methods_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          as_of_date: string | null
          balance: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          employee_id: string
          id: string
          leave_type_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          as_of_date?: string | null
          balance?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          employee_id: string
          id?: string
          leave_type_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          as_of_date?: string | null
          balance?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          employee_id?: string
          id?: string
          leave_type_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_entries: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          effective_date: string
          employee_id: string
          entry_kind: string
          id: string
          leave_type_id: string
          notes: string | null
          quantity_delta: number
          reference_number: string | null
          rule_snapshot: Json
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          effective_date: string
          employee_id: string
          entry_kind: string
          id?: string
          leave_type_id: string
          notes?: string | null
          quantity_delta: number
          reference_number?: string | null
          rule_snapshot?: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          effective_date?: string
          employee_id?: string
          entry_kind?: string
          id?: string
          leave_type_id?: string
          notes?: string | null
          quantity_delta?: number
          reference_number?: string | null
          rule_snapshot?: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_entries_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_entries_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_entries_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          calculation_parameters: Json
          calculation_strategy: string
          code: string
          configuration_version: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          unit: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          calculation_parameters?: Json
          calculation_strategy?: string
          code: string
          configuration_version?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          calculation_parameters?: Json
          calculation_strategy?: string
          code?: string
          configuration_version?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_types_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_types_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_adjustments: {
        Row: {
          adjustment_field: string
          amount_delta: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          explanation: string
          id: string
          loan_id: string
          loan_schedule_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          adjustment_field: string
          amount_delta: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          explanation: string
          id?: string
          loan_id: string
          loan_schedule_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          adjustment_field?: string
          amount_delta?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          explanation?: string
          id?: string
          loan_id?: string
          loan_schedule_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_adjustments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_adjustments_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_adjustments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_adjustments_loan_schedule_id_fkey"
            columns: ["loan_schedule_id"]
            isOneToOne: false
            referencedRelation: "loan_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_adjustments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_payment_allocations: {
        Row: {
          allocated_amount: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          id: string
          loan_payment_id: string
          loan_schedule_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allocated_amount: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          id?: string
          loan_payment_id: string
          loan_schedule_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allocated_amount?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          id?: string
          loan_payment_id?: string
          loan_schedule_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_payment_allocations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payment_allocations_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payment_allocations_loan_payment_id_fkey"
            columns: ["loan_payment_id"]
            isOneToOne: false
            referencedRelation: "loan_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payment_allocations_loan_schedule_id_fkey"
            columns: ["loan_schedule_id"]
            isOneToOne: false
            referencedRelation: "loan_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payment_allocations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          employee_id: string
          id: string
          loan_id: string
          notes: string | null
          payment_date: string
          reference_number: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          employee_id: string
          id?: string
          loan_id: string
          notes?: string | null
          payment_date: string
          reference_number?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          employee_id?: string
          id?: string
          loan_id?: string
          notes?: string | null
          payment_date?: string
          reference_number?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_payments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          due_date: string
          generation_method: string
          id: string
          installment_number: number
          interest_due: number
          loan_id: string
          other_due: number
          paid_amount: number
          penalty_due: number
          principal_due: number
          rule_snapshot: Json
          status: string
          total_due: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          due_date: string
          generation_method?: string
          id?: string
          installment_number: number
          interest_due?: number
          loan_id: string
          other_due?: number
          paid_amount?: number
          penalty_due?: number
          principal_due?: number
          rule_snapshot?: Json
          status?: string
          total_due: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          due_date?: string
          generation_method?: string
          id?: string
          installment_number?: number
          interest_due?: number
          loan_id?: string
          other_due?: number
          paid_amount?: number
          penalty_due?: number
          principal_due?: number
          rule_snapshot?: Json
          status?: string
          total_due?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_schedules_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_schedules_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_schedules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_types: {
        Row: {
          calculation_parameters: Json
          calculation_strategy: string
          code: string
          configuration_version: number
          created_at: string
          created_by: string | null
          default_rate: number | null
          default_term_count: number | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          installment_frequency: string
          interest_method_id: string | null
          is_active: boolean
          name: string
          penalty_rule_id: string | null
          rounding_method: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          calculation_parameters?: Json
          calculation_strategy?: string
          code: string
          configuration_version?: number
          created_at?: string
          created_by?: string | null
          default_rate?: number | null
          default_term_count?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          installment_frequency?: string
          interest_method_id?: string | null
          is_active?: boolean
          name: string
          penalty_rule_id?: string | null
          rounding_method?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          calculation_parameters?: Json
          calculation_strategy?: string
          code?: string
          configuration_version?: number
          created_at?: string
          created_by?: string | null
          default_rate?: number | null
          default_term_count?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          installment_frequency?: string
          interest_method_id?: string | null
          is_active?: boolean
          name?: string
          penalty_rule_id?: string | null
          rounding_method?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_types_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_types_interest_method_id_fkey"
            columns: ["interest_method_id"]
            isOneToOne: false
            referencedRelation: "interest_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_types_penalty_rule_id_fkey"
            columns: ["penalty_rule_id"]
            isOneToOne: false
            referencedRelation: "penalty_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_types_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          account_number: string | null
          application_date: string | null
          calculation_preview: Json
          calculation_source: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          employee_id: string
          id: string
          installment_frequency: string
          interest_method_id: string | null
          interest_rate: number | null
          loan_type_id: string
          maturity_date: string | null
          notes: string | null
          penalty_rule_id: string | null
          principal_amount: number
          rounding_method: string
          rule_snapshot: Json
          schedule_method: string
          start_date: string
          status: string
          term_count: number | null
          total_payable_amount: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_number?: string | null
          application_date?: string | null
          calculation_preview?: Json
          calculation_source?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          employee_id: string
          id?: string
          installment_frequency?: string
          interest_method_id?: string | null
          interest_rate?: number | null
          loan_type_id: string
          maturity_date?: string | null
          notes?: string | null
          penalty_rule_id?: string | null
          principal_amount: number
          rounding_method?: string
          rule_snapshot?: Json
          schedule_method?: string
          start_date: string
          status?: string
          term_count?: number | null
          total_payable_amount?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_number?: string | null
          application_date?: string | null
          calculation_preview?: Json
          calculation_source?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          employee_id?: string
          id?: string
          installment_frequency?: string
          interest_method_id?: string | null
          interest_rate?: number | null
          loan_type_id?: string
          maturity_date?: string | null
          notes?: string | null
          penalty_rule_id?: string | null
          principal_amount?: number
          rounding_method?: string
          rule_snapshot?: Json
          schedule_method?: string
          start_date?: string
          status?: string
          term_count?: number | null
          total_payable_amount?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_interest_method_id_fkey"
            columns: ["interest_method_id"]
            isOneToOne: false
            referencedRelation: "interest_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_loan_type_id_fkey"
            columns: ["loan_type_id"]
            isOneToOne: false
            referencedRelation: "loan_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_penalty_rule_id_fkey"
            columns: ["penalty_rule_id"]
            isOneToOne: false
            referencedRelation: "penalty_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      login_activity: {
        Row: {
          details: Json
          id: number
          network_fingerprint: string
          occurred_at: string
          outcome: string
          profile_id: string | null
          request_id: string
          user_agent: string | null
          username_fingerprint: string
        }
        Insert: {
          details?: Json
          id?: never
          network_fingerprint: string
          occurred_at?: string
          outcome: string
          profile_id?: string | null
          request_id?: string
          user_agent?: string | null
          username_fingerprint: string
        }
        Update: {
          details?: Json
          id?: never
          network_fingerprint?: string
          occurred_at?: string
          outcome?: string
          profile_id?: string | null
          request_id?: string
          user_agent?: string | null
          username_fingerprint?: string
        }
        Relationships: [
          {
            foreignKeyName: "login_activity_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      penalty_rules: {
        Row: {
          cap_amount: number | null
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string | null
          effective_from: string | null
          effective_to: string | null
          fixed_amount: number | null
          grace_days: number
          id: string
          is_active: boolean
          name: string
          percentage_rate: number | null
          strategy: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cap_amount?: number | null
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          fixed_amount?: number | null
          grace_days?: number
          id?: string
          is_active?: boolean
          name: string
          percentage_rate?: number | null
          strategy?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cap_amount?: number | null
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          fixed_amount?: number | null
          grace_days?: number
          id?: string
          is_active?: boolean
          name?: string
          percentage_rate?: number | null
          strategy?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "penalty_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_rules_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          display_name: string
          id: string
          role: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          display_name: string
          id: string
          role: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          display_name?: string
          id?: string
          role?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rebate_types: {
        Row: {
          balance_effect: string
          calculation_parameters: Json
          calculation_strategy: string
          code: string
          configuration_version: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string | null
          effective_from: string | null
          effective_to: string | null
          fixed_amount: number | null
          id: string
          is_active: boolean
          name: string
          percentage_rate: number | null
          rounding_method: string
          sort_order: number
          transaction_type_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          balance_effect?: string
          calculation_parameters?: Json
          calculation_strategy?: string
          code: string
          configuration_version?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          name: string
          percentage_rate?: number | null
          rounding_method?: string
          sort_order?: number
          transaction_type_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          balance_effect?: string
          calculation_parameters?: Json
          calculation_strategy?: string
          code?: string
          configuration_version?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          name?: string
          percentage_rate?: number | null
          rounding_method?: string
          sort_order?: number
          transaction_type_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rebate_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rebate_types_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rebate_types_transaction_type_id_fkey"
            columns: ["transaction_type_id"]
            isOneToOne: false
            referencedRelation: "transaction_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rebate_types_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rebates: {
        Row: {
          amount: number
          calculated_amount: number | null
          calculation_source: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          employee_id: string
          id: string
          loan_id: string | null
          override_reason: string | null
          reason: string | null
          rebate_date: string
          rebate_type_id: string
          rule_snapshot: Json
          status: string
          transaction_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          calculated_amount?: number | null
          calculation_source?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          employee_id: string
          id?: string
          loan_id?: string | null
          override_reason?: string | null
          reason?: string | null
          rebate_date: string
          rebate_type_id: string
          rule_snapshot?: Json
          status?: string
          transaction_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          calculated_amount?: number | null
          calculation_source?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          employee_id?: string
          id?: string
          loan_id?: string | null
          override_reason?: string | null
          reason?: string | null
          rebate_date?: string
          rebate_type_id?: string
          rule_snapshot?: Json
          status?: string
          transaction_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rebates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rebates_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rebates_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rebates_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rebates_rebate_type_id_fkey"
            columns: ["rebate_type_id"]
            isOneToOne: false
            referencedRelation: "rebate_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rebates_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rebates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
          value_schema_version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
          value_schema_version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
          value_schema_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_settings_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_types: {
        Row: {
          balance_effect: string
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string | null
          direction: string
          effective_from: string | null
          effective_to: string | null
          financial_category_id: string
          id: string
          is_active: boolean
          name: string
          reference_padding: number
          reference_prefix: string | null
          reference_reset: string
          reference_strategy: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          balance_effect?: string
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          direction: string
          effective_from?: string | null
          effective_to?: string | null
          financial_category_id: string
          id?: string
          is_active?: boolean
          name: string
          reference_padding?: number
          reference_prefix?: string | null
          reference_reset?: string
          reference_strategy?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          balance_effect?: string
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          direction?: string
          effective_from?: string | null
          effective_to?: string | null
          financial_category_id?: string
          id?: string
          is_active?: boolean
          name?: string
          reference_padding?: number
          reference_prefix?: string | null
          reference_reset?: string
          reference_strategy?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_types_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_types_financial_category_id_fkey"
            columns: ["financial_category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_types_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          attachment_document_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string | null
          direction: string
          employee_id: string
          id: string
          metadata: Json
          reference_number: string | null
          status: string
          transaction_date: string
          transaction_type_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          attachment_document_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          direction: string
          employee_id: string
          id?: string
          metadata?: Json
          reference_number?: string | null
          status?: string
          transaction_date: string
          transaction_type_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          attachment_document_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          direction?: string
          employee_id?: string
          id?: string
          metadata?: Json
          reference_number?: string | null
          status?: string
          transaction_date?: string
          transaction_type_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_attachment_document_id_fkey"
            columns: ["attachment_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transaction_type_id_fkey"
            columns: ["transaction_type_id"]
            isOneToOne: false
            referencedRelation: "transaction_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_updated_by_fkey"
            columns: ["updated_by"]
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
      adjust_loan_schedule: {
        Args: {
          actor_profile_id: string
          adjustment_field: string
          amount_delta: number
          explanation: string
          loan_schedule_record_id: string
        }
        Returns: string
      }
      bootstrap_first_admin: {
        Args: {
          account_display_name: string
          account_username: string
          actor_auth_user_id: string
          auth_identifier: string
        }
        Returns: undefined
      }
      confirm_import_job: { Args: { target_job_id: string }; Returns: number }
      create_employee_account: {
        Args: {
          account_username: string
          actor_profile_id: string
          auth_identifier: string
          employee_record_id: string
          new_auth_user_id: string
        }
        Returns: undefined
      }
      create_rebate_record: {
        Args: {
          actor_profile_id: string
          calculated_amount?: number
          calculation_source: string
          employee_record_id: string
          loan_record_id?: string
          override_reason?: string
          rebate_amount: number
          rebate_date: string
          rebate_reason?: string
          rebate_type_record_id: string
          reference_number?: string
        }
        Returns: string
      }
      get_admin_employee_page: {
        Args: {
          actor_profile_id: string
          category_filter?: string
          cursor_id?: string
          cursor_sort_key?: string
          department_filter?: string
          include_archived?: boolean
          page_size?: number
          search_query?: string
          status_filter?: string
        }
        Returns: {
          account_status: string
          active_loan_count: number
          complete_name: string
          deleted_at: string
          department: string
          document_count: number
          email_address: string
          employee_number: string
          employment_category: string
          employment_status: string
          id: string
          leave_balance_count: number
          mobile_number: string
          position_title: string
          profile_id: string
          sort_key: string
          transaction_count: number
          username: string
        }[]
      }
      get_admin_transaction_page: {
        Args: {
          actor_profile_id: string
          cursor_date?: string
          cursor_id?: string
          date_from?: string
          date_to?: string
          employee_filter?: string
          include_archived?: boolean
          page_size?: number
          search_query?: string
          transaction_type_filter?: string
        }
        Returns: Json
      }
      get_my_financial_overview: { Args: never; Returns: Json }
      get_my_statement: {
        Args: {
          category_filter?: string
          end_date?: string
          start_date?: string
          type_filter?: string
        }
        Returns: Json
      }
      manage_document: {
        Args: {
          change_reason?: string
          operation: string
          payload?: Json
          target_id?: string
        }
        Returns: string
      }
      manage_employee_record: {
        Args: {
          actor_profile_id: string
          change_reason?: string
          employee_record_id?: string
          operation: string
          payload?: Json
        }
        Returns: string
      }
      manage_ledger_transaction: {
        Args: {
          actor_profile_id: string
          change_reason?: string
          operation: string
          payload?: Json
          transaction_record_id?: string
        }
        Returns: string
      }
      manage_loan_record: {
        Args: {
          actor_profile_id: string
          change_reason?: string
          loan_record_id?: string
          operation: string
          payload?: Json
          schedule_rows?: Json
        }
        Returns: string
      }
      record_loan_payment: {
        Args: {
          actor_profile_id: string
          loan_record_id: string
          payment_amount: number
          payment_date: string
          payment_notes?: string
          reference_number?: string
          transaction_type_id: string
        }
        Returns: string
      }
      record_password_reset: {
        Args: {
          actor_profile_id: string
          generated_password: boolean
          reset_reason: string
          target_profile_id: string
        }
        Returns: undefined
      }
      replace_loan_schedule: {
        Args: {
          actor_profile_id: string
          change_reason: string
          loan_record_id: string
          p_schedule_method: string
          schedule_rows: Json
        }
        Returns: undefined
      }
      set_account_status: {
        Args: {
          account_enabled: boolean
          actor_profile_id: string
          change_reason: string
          target_profile_id: string
        }
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

