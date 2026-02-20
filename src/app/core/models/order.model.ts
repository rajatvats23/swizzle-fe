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

// Extended Order with timestamps (returned by admin endpoints)
export interface AdminOrder extends Order {
  tax: number;
  deliveryCharge: number;
  paymentId?: string;
  isAssistedOrder: boolean;
  receptionistId?: string;
  createdAt: string;
  updatedAt: string;
}

// Analytics types
export interface DailyOrderCount {
  date: string;
  count: number;
}

export interface TopProduct {
  rank: number;
  productName: string;
  totalQty: number;
  totalRevenue: number;
}

export interface StatusCounts {
  INITIATED: number;
  IN_PROGRESS: number;
  PAYMENT_PENDING: number;
  PAID: number;
  CONFIRMED: number;
}

// Customer aggregate (from admin/customers endpoint)
export interface Customer {
  _id: string;           // phone number (the group key)
  phoneNumber: string;
  customerName?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string;
  firstOrderAt: string;
  statuses: string[];
}

export interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  paidOrders: number;
  todayOrders: number;
  statusCounts: StatusCounts;
  dailyOrders: DailyOrderCount[];
  topProducts: TopProduct[];
}