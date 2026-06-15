export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "seller";
export type PaymentMethod = "cash" | "card" | "transfer" | "nequi" | "other";
export type InventoryMovementType =
  | "purchase"
  | "sale"
  | "adjustment"
  | "damaged"
  | "gift"
  | "internal_consumption";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          role?: UserRole;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      products: {
        Row: {
          id: string;
          name: string;
          category: string;
          stock: number;
          min_stock: number;
          purchase_price: number;
          sale_price: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          stock?: number;
          min_stock?: number;
          purchase_price: number;
          sale_price: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          category?: string;
          min_stock?: number;
          purchase_price?: number;
          sale_price?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      sales: {
        Row: {
          id: string;
          sale_date: string;
          payment_method: PaymentMethod;
          total_amount: number;
          total_cost: number;
          gross_profit: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_date?: string;
          payment_method: PaymentMethod;
          total_amount: number;
          total_cost: number;
          gross_profit: number;
          created_by: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "sales_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          unit_cost: number;
          subtotal: number;
          profit: number;
        };
        Insert: {
          id?: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          unit_cost: number;
          subtotal: number;
          profit: number;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          }
        ];
      };
      inventory_movements: {
        Row: {
          id: string;
          product_id: string;
          movement_type: InventoryMovementType;
          quantity: number;
          reason: string;
          related_sale_id: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          movement_type: InventoryMovementType;
          quantity: number;
          reason: string;
          related_sale_id?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_movements_related_sale_id_fkey";
            columns: ["related_sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          }
        ];
      };
      daily_closings: {
        Row: {
          id: string;
          closing_date: string;
          total_sales: number;
          total_cost: number;
          gross_profit: number;
          cash_total: number;
          card_total: number;
          transfer_total: number;
          nequi_total: number;
          other_total: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          closing_date: string;
          total_sales?: number;
          total_cost?: number;
          gross_profit?: number;
          cash_total?: number;
          card_total?: number;
          transfer_total?: number;
          nequi_total?: number;
          other_total?: number;
          created_by: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "daily_closings_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      register_sale: {
        Args: {
          p_payment_method: PaymentMethod;
          p_items: Json;
        };
        Returns: string;
      };
      record_inventory_movement: {
        Args: {
          p_product_id: string;
          p_movement_type: InventoryMovementType;
          p_quantity: number;
          p_reason: string;
        };
        Returns: string;
      };
      daily_sales_summary: {
        Args: {
          p_summary_date?: string;
        };
        Returns: {
          closing_date: string;
          total_sales: number;
          total_cost: number;
          gross_profit: number;
          cash_total: number;
          card_total: number;
          transfer_total: number;
          nequi_total: number;
          other_total: number;
          sales_count: number;
          already_closed: boolean;
        }[];
      };
      close_day: {
        Args: {
          p_closing_date?: string;
        };
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      payment_method: PaymentMethod;
      inventory_movement_type: InventoryMovementType;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Sale = Database["public"]["Tables"]["sales"]["Row"];
export type SaleItem = Database["public"]["Tables"]["sale_items"]["Row"];
export type InventoryMovement =
  Database["public"]["Tables"]["inventory_movements"]["Row"];
export type DailyClosing =
  Database["public"]["Tables"]["daily_closings"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
