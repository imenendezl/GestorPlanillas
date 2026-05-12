import type { Position, ShiftCode, SwapStatus, UserRole } from "./domain";

export type Database = {
  public: {
    Tables: {
      units: {
        Row: {
          name: string;
          created_at: string;
        };
        Insert: {
          name: string;
          created_at?: string;
        };
        Update: Partial<{
          name: string;
          created_at: string;
        }>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          unit: string;
          position: Position;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name: string;
          last_name: string;
          unit: string;
          position: Position;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          first_name: string;
          last_name: string;
          unit: string;
          position: Position;
          role: UserRole;
          updated_at: string;
        }>;
        Relationships: [];
      };
      shifts: {
        Row: {
          id: string;
          user_id: string;
          shift_date: string;
          shift_codes: ShiftCode[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          shift_date: string;
          shift_codes: ShiftCode[];
        };
        Update: Partial<{
          shift_date: string;
          shift_codes: ShiftCode[];
          updated_at: string;
        }>;
        Relationships: [];
      };
      swap_requests: {
        Row: {
          id: string;
          requester_id: string;
          shift_id: string;
          status: SwapStatus;
          offered_shift_codes: ShiftCode[];
          proposed_dates: string[];
          accepted_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          shift_id: string;
          status?: SwapStatus;
          offered_shift_codes: ShiftCode[];
          proposed_dates?: string[];
          accepted_by?: string | null;
        };
        Update: Partial<{
          status: SwapStatus;
          proposed_dates: string[];
          accepted_by: string | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_position: Position;
      user_role: UserRole;
      swap_status: SwapStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
