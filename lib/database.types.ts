export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      loan_applications: {
        Row: {
          amount: number;
          assessed_at: string | null;
          created_at: string;
          decided_at: string | null;
          existing_emi: number;
          id: number;
          jev_confidence: number | null;
          jev_model: string | null;
          job_type: string;
          loan_type: string;
          monthly_income: number;
          risk_level: string | null;
          risk_probability: number | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          assessed_at?: string | null;
          created_at?: string;
          decided_at?: string | null;
          existing_emi?: number;
          id?: never;
          jev_confidence?: number | null;
          jev_model?: string | null;
          job_type: string;
          loan_type: string;
          monthly_income: number;
          risk_level?: string | null;
          risk_probability?: number | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          assessed_at?: string | null;
          created_at?: string;
          decided_at?: string | null;
          existing_emi?: number;
          id?: never;
          jev_confidence?: number | null;
          jev_model?: string | null;
          job_type?: string;
          loan_type?: string;
          monthly_income?: number;
          risk_level?: string | null;
          risk_probability?: number | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "loan_applications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          role: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          role?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          role?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      save_loan_assessment: {
        Args: {
          p_id: number;
          p_risk_level: string;
          p_risk_probability: number;
          p_jev_confidence: number;
          p_jev_model: string;
        };
        Returns: Database["public"]["Tables"]["loan_applications"]["Row"];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type LoanApplication = Database["public"]["Tables"]["loan_applications"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type LoanType = "bike" | "vehicle" | "mobile";
export type RiskLevel = "low" | "medium" | "high";
export type ApplicationStatus = "pending" | "approved" | "rejected";
