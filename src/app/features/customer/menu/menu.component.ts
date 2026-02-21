import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../../core/services/menu.service';
import { OrderService } from '../../../core/services/order.service';
import { PromoService, Promo, PromoValidateResult } from '../../../core/services/promo.service';
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
  private promoService = inject(PromoService);

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

  // Promo state
  activePromos = signal<Promo[]>([]);
  promoCode = signal('');
  promoResult = signal<PromoValidateResult | null>(null);
  promoError = signal('');
  promoLoading = signal(false);
  showPromoCodes = signal(false);

  // Upsell: products NOT already in cart (up to 6)
  upsellProducts = computed(() => {
    const inCart = new Set(this.cartItems().map(i => i.productId));
    return this.products().filter(p => !inCart.has(p._id)).slice(0, 6);
  });

  // Cart — synced with backend
  cartItems = signal<CartItem[]>([]);

  cartCount = computed(() => this.cartItems().reduce((sum, i) => sum + i.quantity, 0));
  cartTotal = computed(() => this.cartItems().reduce((sum, i) => sum + i.itemTotal, 0));
  discountAmount = computed(() => this.promoResult()?.discountAmount ?? 0);
  finalTotal = computed(() => this.cartTotal() - this.discountAmount());

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

  hasAddons = computed(() => this.productAddons().length > 0);

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.orderId) { this.router.navigate(['/']); return; }
    this.loadMenu();
    this.loadCart();
    this.loadPromos();
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

  loadPromos() {
    this.promoService.getActivePromos().subscribe({
      next: promos => this.activePromos.set(promos),
    });
  }

  // ── Promo ──────────────────────────────────────────────────────────────────

  applyPromo() {
    const code = this.promoCode().trim();
    if (!code) { this.promoError.set('Enter a promo code'); return; }
    this.promoLoading.set(true);
    this.promoError.set('');
    this.promoResult.set(null);
    this.promoService.validatePromo(code, this.cartTotal()).subscribe({
      next: result => {
        this.promoResult.set(result);
        this.promoLoading.set(false);
        this.showPromoCodes.set(false);
      },
      error: e => {
        this.promoError.set(e.error?.error || 'Invalid promo code');
        this.promoLoading.set(false);
      },
    });
  }

  selectPromo(code: string) {
    this.promoCode.set(code);
    this.applyPromo();
  }

  removePromo() {
    this.promoResult.set(null);
    this.promoCode.set('');
    this.promoError.set('');
  }

  promoLabel(p: Promo) {
    return p.discountType === 'percentage' ? `${p.discountValue}% off` : `₹${p.discountValue} off`;
  }

  selectCategory(id: string) { this.selectedCategory.set(id); }

  // Tap product card
  tapProduct(product: Product) {
    const hasAddons = this.allAddons().some(a => product.allowedAddonIds.includes(a._id));
    if (!hasAddons) {
      this.selectedProduct.set(product);
      this.selectedAddons.set([]);
      this.quantity.set(1);
      this.addItemToCart();
    } else {
      this.selectedAddons.set([]);
      this.quantity.set(1);
      this.selectedProduct.set(product);
    }
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
    // Re-validate promo if one was applied (cart total changed)
    if (this.promoResult()) this.removePromo();
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
    if (this.promoResult()) this.removePromo();
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
    if (this.promoResult()) this.removePromo();
    this.orderService.updateItemQuantity(this.orderId, item._id, qty).subscribe({
      next: order => this.cartItems.set(order.items),
      error: () => this.loadCart(),
    });
  }

  removeItem(item: CartItem) {
    if (!item._id) return;
    this.cartItems.update(items => items.filter(i => i._id !== item._id));
    if (this.promoResult()) this.removePromo();
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
