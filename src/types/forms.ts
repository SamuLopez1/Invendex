import type { InventoryMovementType, PaymentMethod } from "./database";

export interface ProductFormInput {
  name: string;
  category: string;
  min_stock: number;
  purchase_price: number;
  sale_price: number;
  is_active?: boolean;
}

export interface CreateProductInput extends ProductFormInput {
  stock?: number;
}

export interface SaleCartItemInput {
  product_id: string;
  quantity: number;
}

export interface RegisterSaleInput {
  payment_method: PaymentMethod;
  items: SaleCartItemInput[];
}

export interface InventoryMovementInput {
  product_id: string;
  movement_type: Exclude<InventoryMovementType, "sale">;
  quantity: number;
  reason: string;
}
