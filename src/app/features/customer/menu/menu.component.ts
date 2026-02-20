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
})
export class MenuComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private menuService = inject(MenuService);
  private orderService = inject(OrderService);

  protected readonly Math = Math;

  orderId = '';

  // Menu data
  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  allAddons = signal<Addon[]>([]);

  // UI state
  searchQuery = signal('');
  selectedCategory = signal('');
  selectedProduct = signal<Product | null>(null);
  selectedAddons = signal<Addon[]>([]);
  quantity = signal(1);
  showCart = signal(false);
  loading = signal(true);

  // Cart — synced with backend
  cartItems = signal<CartItem[]>([]);

  cartCount = computed(() => this.cartItems().reduce((sum, i) => sum + i.quantity, 0));
  cartTotal = computed(() => this.cartItems().reduce((sum, i) => sum + i.itemTotal, 0));

  filteredProducts = computed(() => {
    let prods = this.products();
    const cat = this.selectedCategory();
    const q = this.searchQuery().toLowerCase().trim();
    if (cat) prods = prods.filter(p => p.categoryId === cat);
    if (q) prods = prods.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    return prods;
  });

  productAddons = computed(() => {
    const p = this.selectedProduct();
    if (!p) return [];
    return this.allAddons().filter(a => p.allowedAddonIds.includes(a._id));
  });

  currentPrice = computed(() => {
    const base = this.selectedProduct()?.basePrice || 0;
    return base + this.selectedAddons().reduce((s, a) => s + a.price, 0);
  });

  // Does the tapped product have addons? If yes, open sheet. If no, add straight to cart.
  hasAddons = computed(() => this.productAddons().length > 0);

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.orderId) { this.router.navigate(['/']); return; }
    this.loadMenu();
    this.loadCart();
  }

  loadMenu() {
    this.loading.set(true);
    this.menuService.getCategories().subscribe({
      next: cats => { this.categories.set(cats); if (cats.length) this.selectedCategory.set(cats[0]._id); },
    });
    this.menuService.getProducts().subscribe({
      next: prods => { this.products.set(prods); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.menuService.getAddons().subscribe({ next: addons => this.allAddons.set(addons) });
  }

  loadCart() {
    this.orderService.getOrder(this.orderId).subscribe({
      next: order => this.cartItems.set(order.items || []),
    });
  }

  selectCategory(id: string) { this.selectedCategory.set(id); }

  // Tap product card
  tapProduct(product: Product) {
    this.selectedProduct.set(product);
    this.selectedAddons.set([]);
    this.quantity.set(1);
    // If no addons, add directly
    if (!this.allAddons().some(a => product.allowedAddonIds.includes(a._id))) {
      this.addItemToCart();
    }
    // Otherwise sheet opens via template (selectedProduct truthy)
  }

  closeSheet() {
    this.selectedProduct.set(null);
    this.selectedAddons.set([]);
    this.quantity.set(1);
  }

  isAddonSelected(id: string) { return this.selectedAddons().some(a => a._id === id); }

  toggleAddon(addon: Addon, isSingle: boolean) {
    if (isSingle) { this.selectedAddons.set([addon]); }
    else {
      this.isAddonSelected(addon._id)
        ? this.selectedAddons.update(list => list.filter(a => a._id !== addon._id))
        : this.selectedAddons.update(list => [...list, addon]);
    }
  }

  incQty() { this.quantity.update(q => q + 1); }
  decQty() { this.quantity.update(q => Math.max(1, q - 1)); }

  addItemToCart() {
    const product = this.selectedProduct();
    if (!product) return;
    const addonTotal = this.selectedAddons().reduce((s, a) => s + a.price, 0);
    const newItem: CartItem = {
      productId: product._id,
      productName: product.name,
      basePrice: product.basePrice,
      quantity: this.quantity(),
      selectedAddons: this.selectedAddons().map(a => ({ addonId: a._id, addonName: a.name, addonPrice: a.price })),
      itemTotal: (product.basePrice + addonTotal) * this.quantity(),
    };
    this.cartItems.update(items => [...items, newItem]);
    this.closeSheet();
    this.orderService.addItemToOrder(this.orderId, newItem).subscribe({
      next: order => this.cartItems.set(order.items),
      error: () => {
        this.cartItems.update(items => items.filter(i =>
          !(i.productId === newItem.productId && JSON.stringify(i.selectedAddons) === JSON.stringify(newItem.selectedAddons))
        ));
      },
    });
  }

  increaseQuantity(item: CartItem) {
    if (!item._id) return;
    const qty = item.quantity + 1;
    this.cartItems.update(items => items.map(i => i._id === item._id ? { ...i, quantity: qty, itemTotal: this.calcTotal(i, qty) } : i));
    this.orderService.updateItemQuantity(this.orderId, item._id, qty).subscribe({
      next: order => this.cartItems.set(order.items),
      error: () => this.loadCart(),
    });
  }

  decreaseQuantity(item: CartItem) {
    if (!item._id) return;
    if (item.quantity <= 1) { this.removeItem(item); return; }
    const qty = item.quantity - 1;
    this.cartItems.update(items => items.map(i => i._id === item._id ? { ...i, quantity: qty, itemTotal: this.calcTotal(i, qty) } : i));
    this.orderService.updateItemQuantity(this.orderId, item._id, qty).subscribe({
      next: order => this.cartItems.set(order.items),
      error: () => this.loadCart(),
    });
  }

  removeItem(item: CartItem) {
    if (!item._id) return;
    this.cartItems.update(items => items.filter(i => i._id !== item._id));
    this.orderService.removeItemFromOrder(this.orderId, item._id).subscribe({
      next: order => this.cartItems.set(order.items),
      error: () => this.loadCart(),
    });
  }

  private calcTotal(item: CartItem, qty: number) {
    return (item.basePrice + item.selectedAddons.reduce((s, a) => s + a.addonPrice, 0)) * qty;
  }

  proceedToCheckout() {
    this.showCart.set(false);
    this.router.navigate(['/order', this.orderId, 'checkout']);
  }

  goBack() { this.router.navigate(['/order', this.orderId, 'address']); }

  formatCurrency(n: number) { return '₹' + n.toFixed(2); }
  getAddonNames(addons: CartItem['selectedAddons']) { return addons.map(a => a.addonName).join(', '); }
  hasSingleTypeAddon() { return this.productAddons().some(a => a.type === 'single'); }
}
