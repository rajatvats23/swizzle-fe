// src/app/core/models/order.model.ts

export interface CartItem {
  _id?: string;  // ✅ ADDED: Backend item ID (optional, only set after sync)
  productId: string;
  productName: string;
  basePrice: number;
  quantity: number;
  selectedAddons: {
    addonId: string;
    addonName: string;
    addonPrice: number;
  }[];
  itemTotal: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  phoneNumber: string;
  customerName?: string;
  deliveryAddress?: {
    text: string;
    lat: number;
    lng: number;
  };
  items: CartItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  isAssistedOrder: boolean;
}

export enum OrderStatus {
  INITIATED = 'INITIATED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID',
  CONFIRMED = 'CONFIRMED'
}