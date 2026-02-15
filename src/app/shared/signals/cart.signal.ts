// src/app/shared/signals/cart.signal.ts
import { computed, signal } from '@angular/core';
import { CartItem } from '../../core/models/order.model';

export const cartItems = signal<CartItem[]>([]);

export const cartTotal = computed(() => 
  cartItems().reduce((sum, item) => sum + item.itemTotal, 0)
);

export const cartCount = computed(() => 
  cartItems().reduce((sum, item) => sum + item.quantity, 0)
);

export function addToCart(item: CartItem) {
  const existing = cartItems().find(i => 
    i.productId === item.productId && 
    JSON.stringify(i.selectedAddons) === JSON.stringify(item.selectedAddons)
  );

  if (existing) {
    updateQuantity(item.productId, existing.quantity + item.quantity, item.selectedAddons);
  } else {
    cartItems.set([...cartItems(), item]);
  }
}

export function updateQuantity(productId: string, quantity: number, selectedAddons: CartItem['selectedAddons']) {
  if (quantity <= 0) {
    removeFromCart(productId, selectedAddons);
    return;
  }

  cartItems.update(items => 
    items.map(item => {
      if (item.productId === productId && 
          JSON.stringify(item.selectedAddons) === JSON.stringify(selectedAddons)) {
        const addonTotal = item.selectedAddons.reduce((sum, a) => sum + a.addonPrice, 0);
        return {
          ...item,
          quantity,
          itemTotal: (item.basePrice + addonTotal) * quantity
        };
      }
      return item;
    })
  );
}

export function removeFromCart(productId: string, selectedAddons: CartItem['selectedAddons']) {
  cartItems.update(items => 
    items.filter(item => 
      !(item.productId === productId && 
        JSON.stringify(item.selectedAddons) === JSON.stringify(selectedAddons))
    )
  );
}

export function clearCart() {
  cartItems.set([]);
}