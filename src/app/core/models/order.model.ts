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

export interface CartItem {
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

export enum OrderStatus {
  INITIATED = 'INITIATED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID',
  CONFIRMED = 'CONFIRMED'
}