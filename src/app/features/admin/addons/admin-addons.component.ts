import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Addon } from '../../../core/models/product.model';
import { MenuService } from '../../../core/services/menu.service';

@Component({
  selector: 'app-admin-addons',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-addons.component.html',
  host: { class: 'flex flex-col flex-1 min-h-0' },
})
export class AdminAddonsComponent implements OnInit {
  private menuService = inject(MenuService);

  addons = signal<Addon[]>([]);
  searchQuery = signal('');
  filterType = signal<'' | 'single' | 'multiple'>('');
  editingAddonId = signal<string | null>(null);
  deleteConfirmId = signal<string | null>(null);
  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  // Create form
  showCreateForm = signal(false);
  createName = '';
  createType: 'single' | 'multiple' = 'single';
  createOptions: { name: string; price: string }[] = [{ name: '', price: '0' }, { name: '', price: '0' }];

  // Edit form
  editName = '';
  editType: 'single' | 'multiple' = 'single';
  editOptions: { id: string; name: string; price: string }[] = [];

  filteredAddons = computed(() => {
    let list = this.addons();
    const q = this.searchQuery().toLowerCase().trim();
    const typeFilter = this.filterType();
    if (q) list = list.filter(a => a.name.toLowerCase().includes(q) || a.options.some(o => o.name.toLowerCase().includes(q)));
    if (typeFilter) list = list.filter(a => a.type === typeFilter);
    return list;
  });

  ngOnInit() {
    this.menuService.getAddons().subscribe(addons => this.addons.set(addons));
  }

  // Create
  openCreateForm() {
    this.showCreateForm.set(true);
    this.editingAddonId.set(null);
    this.createName = '';
    this.createType = 'single';
    this.createOptions = [{ name: '', price: '0' }, { name: '', price: '0' }];
  }
  cancelCreate() { this.showCreateForm.set(false); }
  addCreateOption() { this.createOptions = [...this.createOptions, { name: '', price: '0' }]; }
  removeCreateOption(index: number) {
    if (this.createOptions.length <= 1) return;
    this.createOptions = this.createOptions.filter((_, i) => i !== index);
  }
  submitCreate() {
    const name = this.createName.trim();
    if (!name) return;
    const options = this.createOptions.filter(o => o.name.trim()).map(o => ({ name: o.name.trim(), price: Number(o.price) || 0 }));
    if (options.length === 0) return;
    this.menuService.createAddon({ name, type: this.createType, options }).subscribe({
      next: addon => {
        this.addons.update(list => [addon, ...list]);
        this.showCreateForm.set(false);
        this.showToast('Addon created', 'success');
      },
      error: () => this.showToast('Failed to create addon', 'error'),
    });
  }

  // Edit
  startEdit(addon: Addon) {
    this.showCreateForm.set(false);
    this.editingAddonId.set(addon._id);
    this.editName = addon.name;
    this.editType = addon.type;
    this.editOptions = addon.options.map(o => ({ id: o._id, name: o.name, price: String(o.price) }));
  }
  cancelEdit() { this.editingAddonId.set(null); }
  addEditOption() { this.editOptions = [...this.editOptions, { id: `new_${Date.now()}`, name: '', price: '0' }]; }
  removeEditOption(index: number) {
    if (this.editOptions.length <= 1) return;
    this.editOptions = this.editOptions.filter((_, i) => i !== index);
  }
  submitEdit(id: string) {
    const name = this.editName.trim();
    if (!name) return;
    const options = this.editOptions.filter(o => o.name.trim()).map(o => ({ name: o.name.trim(), price: Number(o.price) || 0 }));
    if (options.length === 0) return;
    this.menuService.updateAddon(id, { name, type: this.editType, options } as any).subscribe({
      next: addon => {
        this.addons.update(list => list.map(a => a._id === id ? addon : a));
        this.editingAddonId.set(null);
        this.showToast('Addon updated', 'success');
      },
      error: () => this.showToast('Failed to update addon', 'error'),
    });
  }

  // Toggle active
  toggleActive(id: string) {
    const addon = this.addons().find(a => a._id === id);
    if (!addon) return;
    this.menuService.updateAddon(id, { isActive: !addon.isActive }).subscribe({
      next: updated => this.addons.update(list => list.map(a => a._id === id ? updated : a)),
    });
  }

  // Delete
  confirmDelete(id: string) { this.deleteConfirmId.set(id); }
  cancelDelete() { this.deleteConfirmId.set(null); }
  submitDelete(id: string) {
    this.menuService.deleteAddon(id).subscribe({
      next: () => {
        this.addons.update(list => list.filter(a => a._id !== id));
        this.deleteConfirmId.set(null);
        if (this.editingAddonId() === id) this.editingAddonId.set(null);
        this.showToast('Addon deleted', 'success');
      },
      error: () => this.showToast('Failed to delete addon', 'error'),
    });
  }

  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  showToast(message: string, type: 'success' | 'error') {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set({ message, type });
    this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
  }
}
