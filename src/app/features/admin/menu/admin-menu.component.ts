import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category, Product, Addon } from '../../../core/models/product.model';
import { MenuService } from '../../../core/services/menu.service';

@Component({
  selector: 'app-admin-menu',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-menu.component.html',
  host: { class: 'flex flex-col flex-1 min-h-0' },
})
export class AdminMenuComponent implements OnInit {
  private menuService = inject(MenuService);

  // Data
  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  allAddons = signal<Addon[]>([]);
  loading = signal(true);

  // Panel A
  selectedCategoryId = signal<string | null>(null);
  showAddCategory = signal(false);
  newCategoryName = '';

  // Panel B
  productSearch = signal('');
  selectedProductId = signal<string | null>(null);
  isCreatingProduct = signal(false);

  // Panel C form
  form: {
    name: string; description: string; basePrice: number | null;
    categoryId: string; imageUrl: string; isActive: boolean;
    displayOrder: number | null; allowedAddonIds: string[];
  } = this.emptyForm();

  saving = signal(false);
  deleteConfirmId = signal<string | null>(null);
  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // Computed
  selectedCategory = computed(() =>
    this.categories().find(c => c._id === this.selectedCategoryId()) ?? null
  );

  categoryProducts = computed(() => {
    const catId = this.selectedCategoryId();
    const q = this.productSearch().toLowerCase().trim();
    let list = catId ? this.products().filter(p => p.categoryId === catId) : this.products();
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    return list;
  });

  selectedProduct = computed(() =>
    this.products().find(p => p._id === this.selectedProductId()) ?? null
  );

  productCountByCategory = computed(() => {
    const map = new Map<string, number>();
    for (const p of this.products()) map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1);
    return map;
  });

  showDetailPanel = computed(() => this.selectedProductId() !== null || this.isCreatingProduct());

  ngOnInit() {
    this.menuService.getCategories().subscribe(cats => {
      this.categories.set(cats);
      this.loading.set(false);
    });
    this.menuService.getProducts().subscribe(prods => this.products.set(prods));
    this.menuService.getAddons().subscribe(addons => this.allAddons.set(addons));
  }

  // Category actions
  selectCategory(id: string) {
    if (this.selectedCategoryId() === id) return;
    this.selectedCategoryId.set(id);
    this.productSearch.set('');
    this.closeDetail();
  }

  openAddCategory() { this.newCategoryName = ''; this.showAddCategory.set(true); }
  cancelAddCategory() { this.showAddCategory.set(false); }

  submitAddCategory() {
    const name = this.newCategoryName.trim();
    if (!name) return;
    this.menuService.createCategory({ name, displayOrder: this.categories().length + 1 }).subscribe({
      next: cat => {
        this.categories.update(list => [...list, cat]);
        this.showAddCategory.set(false);
        this.newCategoryName = '';
        this.showToast(`"${cat.name}" added`, 'success');
      },
      error: () => this.showToast('Failed to create category', 'error'),
    });
  }

  // Product actions
  selectProduct(product: Product) {
    this.selectedProductId.set(product._id);
    this.isCreatingProduct.set(false);
    this.deleteConfirmId.set(null);
    this.form = {
      name: product.name, description: product.description,
      basePrice: product.basePrice, categoryId: product.categoryId,
      imageUrl: product.imageUrl, isActive: product.isActive,
      displayOrder: product.displayOrder, allowedAddonIds: [...product.allowedAddonIds],
    };
  }

  openCreateProduct() {
    this.selectedProductId.set(null);
    this.isCreatingProduct.set(true);
    this.deleteConfirmId.set(null);
    this.form = this.emptyForm(this.selectedCategoryId() ?? '');
  }

  closeDetail() {
    this.selectedProductId.set(null);
    this.isCreatingProduct.set(false);
    this.deleteConfirmId.set(null);
  }

  saveProduct() {
    const name = this.form.name.trim();
    if (!name || !this.form.categoryId || this.form.basePrice === null) return;
    this.saving.set(true);

    const payload = {
      name, description: this.form.description.trim(),
      basePrice: Number(this.form.basePrice),
      categoryId: this.form.categoryId,
      imageUrl: this.form.imageUrl.trim(),
      isActive: this.form.isActive,
      displayOrder: Number(this.form.displayOrder) || 1,
      allowedAddonIds: [...this.form.allowedAddonIds],
    };

    if (this.isCreatingProduct()) {
      this.menuService.createProduct(payload as any).subscribe({
        next: prod => {
          this.products.update(list => [...list, prod]);
          this.selectedProductId.set(prod._id);
          this.isCreatingProduct.set(false);
          this.saving.set(false);
          this.showToast('Product created', 'success');
        },
        error: () => { this.saving.set(false); this.showToast('Failed to create product', 'error'); },
      });
    } else {
      const id = this.selectedProductId()!;
      this.menuService.updateProduct(id, payload).subscribe({
        next: prod => {
          this.products.update(list => list.map(p => p._id === id ? prod : p));
          this.saving.set(false);
          this.showToast('Product saved', 'success');
        },
        error: () => { this.saving.set(false); this.showToast('Failed to save product', 'error'); },
      });
    }
  }

  discardProduct() {
    if (this.isCreatingProduct()) { this.closeDetail(); }
    else { const prod = this.selectedProduct(); if (prod) this.selectProduct(prod); }
  }

  confirmDelete(id: string) { this.deleteConfirmId.set(id); }
  cancelDelete() { this.deleteConfirmId.set(null); }

  submitDelete(id: string) {
    this.menuService.deleteProduct(id).subscribe({
      next: () => {
        this.products.update(list => list.filter(p => p._id !== id));
        this.closeDetail();
        this.showToast('Product deleted', 'success');
      },
      error: () => this.showToast('Failed to delete product', 'error'),
    });
  }

  toggleAddon(addonId: string) {
    const idx = this.form.allowedAddonIds.indexOf(addonId);
    this.form.allowedAddonIds = idx === -1
      ? [...this.form.allowedAddonIds, addonId]
      : this.form.allowedAddonIds.filter(id => id !== addonId);
  }

  isAddonSelected(addonId: string) { return this.form.allowedAddonIds.includes(addonId); }
  getInitials(name: string) { return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase(); }
  formatPrice(price: number) { return `\u20b9${price}`; }

  private emptyForm(categoryId = ''): typeof this.form {
    return { name: '', description: '', basePrice: null, categoryId, imageUrl: '', isActive: true, displayOrder: null, allowedAddonIds: [] };
  }

  showToast(message: string, type: 'success' | 'error') {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set({ message, type });
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }
}
