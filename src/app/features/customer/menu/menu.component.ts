// src/app/features/customer/menu/menu.component.ts

import { Component, signal, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../../core/services/cart.service';
import { Category, Product } from '../../../core/models/product.model';
import { MenuService } from '../../../core/services/menu.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu.component.html',
})
export class MenuComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private menuService = inject(MenuService);
  cartService = inject(CartService); // Public for template
  
  orderId = signal<string>('');
  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  selectedCategory = signal<string | null>(null);
  loading = signal<boolean>(false);
  
  // Addon modal
  showAddonModal = signal<boolean>(false);
  selectedProduct = signal<Product | null>(null);
  selectedAddons = signal<string[]>([]);
  quantity = signal<number>(1);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.orderId.set(id);
    }

    this.loadCategories();
  }

  loadCategories() {
    this.loading.set(true);
    this.menuService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        if (categories.length > 0) {
          this.selectCategory(categories[0]._id);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load categories', err);
        this.loading.set(false);
      }
    });
  }

  selectCategory(categoryId: string) {
    this.selectedCategory.set(categoryId);
    this.loadProducts(categoryId);
  }

  loadProducts(categoryId: string) {
    this.loading.set(true);
    this.menuService.getProducts(categoryId).subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load products', err);
        this.loading.set(false);
      }
    });
  }

  openAddonModal(product: Product) {
    this.selectedProduct.set(product);
    this.selectedAddons.set([]);
    this.quantity.set(1);
    this.showAddonModal.set(true);
  }

  closeAddonModal() {
    this.showAddonModal.set(false);
    this.selectedProduct.set(null);
  }

  toggleAddon(addonId: string, addonType: string) {
    if (addonType === 'SINGLE_SELECT') {
      // Replace existing selection
      this.selectedAddons.set([addonId]);
    } else {
      // Multi-select: toggle
      const current = this.selectedAddons();
      if (current.includes(addonId)) {
        this.selectedAddons.set(current.filter(id => id !== addonId));
      } else {
        this.selectedAddons.set([...current, addonId]);
      }
    }
  }

  isAddonSelected(addonId: string): boolean {
    return this.selectedAddons().includes(addonId);
  }

  incrementQuantity() {
    this.quantity.update(q => q + 1);
  }

  decrementQuantity() {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  calculatePrice(): number {
    const product = this.selectedProduct();
    if (!product) return 0;

    const addonTotal = this.selectedAddons().reduce((sum, addonId) => {
      const addon = product.allowedAddons?.find(a => a._id === addonId);
      return sum + (addon?.price || 0);
    }, 0);

    return (product.basePrice + addonTotal) * this.quantity();
  }

  addToCart() {
    const product = this.selectedProduct();
    if (!product) return;

    const selectedAddonObjects = this.selectedAddons().map(addonId => {
      const addon = product.allowedAddons?.find(a => a._id === addonId);
      return {
        addonId,
        addonName: addon?.name || '',
        addonPrice: addon?.price || 0
      };
    });

    const cartItem: CartItem = {
      productId: product._id,
      productName: product.name,
      basePrice: product.basePrice,
      quantity: this.quantity(),
      selectedAddons: selectedAddonObjects,
      itemTotal: this.calculatePrice()
    };

    this.cartService.addItem(cartItem);
    this.closeAddonModal();
  }

  goToCheckout() {
    this.router.navigate(['/order', this.orderId(), 'checkout']);
  }

  goBack() {
    this.router.navigate(['/order', this.orderId(), 'address']);
  }
}