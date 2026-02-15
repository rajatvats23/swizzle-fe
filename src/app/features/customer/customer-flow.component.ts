import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../core/services/menu.service';
import { Category, Product, Addon } from '../../core/models/product.model';
import { cartItems, cartCount, cartTotal, addToCart, updateQuantity, removeFromCart } from '../../shared/signals/cart.signal';
import { CartItem } from '../../core/models/order.model';

@Component({
  selector: 'app-customer-flow',
  standalone: true,
  imports: [FormsModule],
  template: `
    
  `
})
export class CustomerFlowComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private menuService = inject(MenuService);

  protected readonly Math = Math;
  protected readonly JSON = JSON;

  orderId = '';
  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  addons = signal<Addon[]>([]);
  searchQuery = '';
  
  selectedCategory = signal<string>('');
  selectedProduct = signal<Product | null>(null);
  selectedAddons = signal<Addon[]>([]);
  quantity = signal(1);
  showCart = signal(false);

  cartItems = cartItems;
  cartCount = cartCount;
  cartTotal = cartTotal;

  filteredProducts = computed(() => {
    let prods = this.products();
    const catId = this.selectedCategory();
    const query = this.searchQuery.toLowerCase().trim();

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
    return this.addons().filter(a => product.allowedAddonIds.includes(a._id));
  });

  currentPrice = computed(() => {
    const base = this.selectedProduct()?.basePrice || 0;
    const addonTotal = this.selectedAddons().reduce((sum, a) => sum + a.price, 0);
    return base + addonTotal;
  });

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    this.loadMenu();
  }

  loadMenu() {
    this.menuService.getCategories().subscribe(cats => {
      this.categories.set(cats);
      if (cats.length > 0) this.selectedCategory.set(cats[0]._id);
    });
    this.menuService.getProducts().subscribe(prods => this.products.set(prods));
    this.menuService.getAddons().subscribe(addons => this.addons.set(addons));
  }

  onSearch() {
    // Triggers filteredProducts computed
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
        this.selectedAddons.update(addons => addons.filter(a => a._id !== addon._id));
      } else {
        this.selectedAddons.update(addons => [...addons, addon]);
      }
    }
  }

  addItemToCart() {
    const product = this.selectedProduct();
    if (!product) return;

    const addonTotal = this.selectedAddons().reduce((sum, a) => sum + a.price, 0);
    const item: CartItem = {
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

    addToCart(item);
    this.closeModal();
  }

  increaseQuantity(item: CartItem) {
    updateQuantity(item.productId, item.quantity + 1, item.selectedAddons);
  }

  decreaseQuantity(item: CartItem) {
    updateQuantity(item.productId, item.quantity - 1, item.selectedAddons);
  }

  removeItem(item: CartItem) {
    removeFromCart(item.productId, item.selectedAddons);
  }

  proceedToCheckout() {
    this.router.navigate(['/order', this.orderId, 'checkout']);
  }

  goBack() {
    this.router.navigate(['/order', this.orderId, 'address']);
  }
}