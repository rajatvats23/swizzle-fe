// src/app/core/models/product.model.ts
export interface Category {
  _id: string;
  name: string;
  displayOrder: number;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  categoryId: string;
  categoryName: string;
  allowedAddonIds: string[];
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
}

export interface AddonOption {
  _id: string;
  name: string;
  price: number;
}

export interface Addon {
  _id: string;
  name: string;
  price: number;
  type: 'single' | 'multiple';
  isActive: boolean;
  options: AddonOption[];
}