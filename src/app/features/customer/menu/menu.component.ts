import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../../core/services/menu.service';
import { OrderService } from '../../../core/services/order.service';
import { Category, Product, Addon } from '../../../core/models/product.model';
import { CartItem } from '../../../core/models/order.model';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private menuService = inject(MenuService);
  private orderService = inject(OrderService);

  protected readonly Math = Math;
  protected readonly JSON = JSON;

  orderId = '';
  
  // Menu data
  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  allAddons = signal<Addon[]>([]);
  
  // UI state
  searchQuery = signal('');
  selectedCategory = signal<string>('');
  selectedProduct = signal<Product | null>(null);
  selectedAddons = signal<Addon[]>([]);
  quantity = signal(1);
  showCart = signal(false);
  loading = signal(false);
  
  // ✅ CART STATE - Synced with backend
  cartItems = signal<CartItem[]>([]);

  // Computed values
  cartCount = computed(() => 
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  cartTotal = computed(() => 
    this.cartItems().reduce((sum, item) => sum + item.itemTotal, 0)
  );

  filteredProducts = computed(() => {
    let prods = this.products();
    const catId = this.selectedCategory();
    const query = this.searchQuery().toLowerCase().trim();

    if (catId) {
      prods = prods.filter(p => p.categoryId === catId);
    }
    
    if (query) {
      prods = prods.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }

    return prods;
  });

  productAddons = computed(() => {
    const product = this.selectedProduct();
    if (!product) return [];
    return this.allAddons().filter(a => 
      product.allowedAddonIds.includes(a._id) && a.isActive
    );
  });

  currentPrice = computed(() => {
    const base = this.selectedProduct()?.basePrice || 0;
    const addonTotal = this.selectedAddons().reduce((sum, a) => sum + a.price, 0);
    return base + addonTotal;
  });

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    this.loadMenu();
    this.loadCart();
  }

  loadMenu() {
    this.loading.set(true);

    this.menuService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        if (cats.length > 0) {
          this.selectedCategory.set(cats[0]._id);
        }
      },
      error: (err) => console.error('Failed to load categories:', err)
    });

    this.menuService.getProducts().subscribe({
      next: (prods) => {
        this.products.set(prods);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this.loading.set(false);
      }
    });

    this.menuService.getAddons().subscribe({
      next: (addons) => this.allAddons.set(addons),
      error: (err) => console.error('Failed to load addons:', err)
    });
  }

  // ✅ Load existing cart from backend
  loadCart() {
    this.orderService.getOrder(this.orderId).subscribe({
      next: (order) => {
        this.cartItems.set(order.items || []);
      },
      error: (err) => console.error('Failed to load cart:', err)
    });
  }

  onSearch() {
    // Triggers filteredProducts computed
  }

  selectCategory(categoryId: string) {
    this.selectedCategory.set(categoryId);
  }

  openAddonModal(product: Product) {
    this.selectedProduct.set(product);
    this.selectedAddons.set([]);
    this.quantity.set(1);
  }

  closeModal() {
    this.selectedProduct.set(null);
    this.selectedAddons.set([]);
    this.quantity.set(1);
  }

  isAddonSelected(addonId: string): boolean {
    return this.selectedAddons().some(a => a._id === addonId);
  }

  toggleAddon(addon: Addon, isSingle: boolean) {
    if (isSingle) {
      this.selectedAddons.set([addon]);
    } else {
      if (this.isAddonSelected(addon._id)) {
        this.selectedAddons.update(addons => 
          addons.filter(a => a._id !== addon._id)
        );
      } else {
        this.selectedAddons.update(addons => [...addons, addon]);
      }
    }
  }

  // ✅ Add item - synced with backend
  addItemToCart() {
    const product = this.selectedProduct();
    if (!product) return;

    const addonTotal = this.selectedAddons().reduce((sum, a) => sum + a.price, 0);
    const newItem: CartItem = {
      productId: product._id,
      productName: product.name,
      basePrice: product.basePrice,
      quantity: this.quantity(),
      selectedAddons: this.selectedAddons().map(a => ({
        addonId: a._id,
        addonName: a.name,
        addonPrice: a.price
      })),
      itemTotal: (product.basePrice + addonTotal) * this.quantity()
    };

    // Optimistic UI update
    this.cartItems.update(items => [...items, newItem]);
    this.closeModal();

    // Sync with backend
    this.orderService.addItemToOrder(this.orderId, newItem).subscribe({
      next: (order) => {
        // Replace with backend response (includes item._id)
        this.cartItems.set(order.items);
      },
      error: (err) => {
        console.error('Failed to add item:', err);
        // Rollback optimistic update
        this.cartItems.update(items => 
          items.filter(item => 
            !(item.productId === newItem.productId && 
              JSON.stringify(item.selectedAddons) === JSON.stringify(newItem.selectedAddons))
          )
        );
        alert('Failed to add item. Please try again.');
      }
    });
  }

  // ✅ Update quantity - synced with backend
  increaseQuantity(item: CartItem) {
    if (!item._id) return;

    const newQuantity = item.quantity + 1;
    
    // Optimistic update
    this.cartItems.update(items =>
      items.map(i => i._id === item._id ? { ...i, quantity: newQuantity, itemTotal: this.calculateItemTotal(i, newQuantity) } : i)
    );

    // Sync with backend
    this.orderService.updateItemQuantity(this.orderId, item._id, newQuantity).subscribe({
      next: (order) => {
        this.cartItems.set(order.items);
      },
      error: (err) => {
        console.error('Failed to update quantity:', err);
        // Rollback
        this.loadCart();
      }
    });
  }

  decreaseQuantity(item: CartItem) {
    if (!item._id) return;

    const newQuantity = item.quantity - 1;
    
    if (newQuantity < 1) {
      this.removeItem(item);
      return;
    }

    // Optimistic update
    this.cartItems.update(items =>
      items.map(i => i._id === item._id ? { ...i, quantity: newQuantity, itemTotal: this.calculateItemTotal(i, newQuantity) } : i)
    );

    // Sync with backend
    this.orderService.updateItemQuantity(this.orderId, item._id, newQuantity).subscribe({
      next: (order) => {
        this.cartItems.set(order.items);
      },
      error: (err) => {
        console.error('Failed to update quantity:', err);
        this.loadCart();
      }
    });
  }

  // ✅ Remove item - synced with backend
  removeItem(item: CartItem) {
    if (!item._id) return;

    // Optimistic update
    this.cartItems.update(items => items.filter(i => i._id !== item._id));

    // Sync with backend
    this.orderService.removeItemFromOrder(this.orderId, item._id).subscribe({
      next: (order) => {
        this.cartItems.set(order.items);
      },
      error: (err) => {
        console.error('Failed to remove item:', err);
        this.loadCart();
      }
    });
  }

  private calculateItemTotal(item: CartItem, quantity: number): number {
    const addonTotal = item.selectedAddons.reduce((sum, a) => sum + a.addonPrice, 0);
    return (item.basePrice + addonTotal) * quantity;
  }

  proceedToCheckout() {
    this.showCart.set(false);
    this.router.navigate(['/order', this.orderId, 'checkout']);
  }

  goBack() {
    this.router.navigate(['/order', this.orderId, 'address']);
  }

  // Helper methods for template
  getAddonNames(addons: CartItem['selectedAddons']): string {
    return addons.map(a => a.addonName).join(', ');
  }

  // Quantity controls for modal (before item is added to cart)
  increaseQuantityModal() {
    this.quantity.update(q => q + 1);
  }

  decreaseQuantityModal() {
    this.quantity.update(q => Math.max(1, q - 1));
  }
}