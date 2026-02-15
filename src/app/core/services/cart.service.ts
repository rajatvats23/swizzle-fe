// src/app/core/services/cart.service.ts

import { Injectable, signal, computed } from '@angular/core';

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

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = signal<CartItem[]>([]);

  // Computed signals
  items = this.cartItems.asReadonly();
  itemCount = computed(() => this.cartItems().reduce((sum, item) => sum + item.quantity, 0));
  total = computed(() => this.cartItems().reduce((sum, item) => sum + item.itemTotal, 0));

  addItem(item: CartItem) {
    // Check if same product with same addons exists
    const existingIndex = this.cartItems().findIndex(cartItem => 
      cartItem.productId === item.productId &&
      this.addonsMatch(cartItem.selectedAddons, item.selectedAddons)
    );

    if (existingIndex >= 0) {
      // Update quantity
      this.cartItems.update(items => {
        const updated = [...items];
        updated[existingIndex].quantity += item.quantity;
        updated[existingIndex].itemTotal = this.calculateItemTotal(updated[existingIndex]);
        return updated;
      });
    } else {
      // Add new item
      this.cartItems.update(items => [...items, item]);
    }
  }

  updateQuantity(index: number, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(index);
      return;
    }

    this.cartItems.update(items => {
      const updated = [...items];
      updated[index].quantity = quantity;
      updated[index].itemTotal = this.calculateItemTotal(updated[index]);
      return updated;
    });
  }

  removeItem(index: number) {
    this.cartItems.update(items => items.filter((_, i) => i !== index));
  }

  clearCart() {
    this.cartItems.set([]);
  }

  private addonsMatch(addons1: any[], addons2: any[]): boolean {
    if (addons1.length !== addons2.length) return false;
    
    const ids1 = addons1.map(a => a.addonId).sort();
    const ids2 = addons2.map(a => a.addonId).sort();
    
    return ids1.every((id, i) => id === ids2[i]);
  }

  private calculateItemTotal(item: CartItem): number {
    const addonTotal = item.selectedAddons.reduce((sum, addon) => sum + addon.addonPrice, 0);
    return (item.basePrice + addonTotal) * item.quantity;
  }
}