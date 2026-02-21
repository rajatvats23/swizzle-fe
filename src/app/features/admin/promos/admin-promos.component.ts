import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PromoService, Promo } from '../../../core/services/promo.service';

@Component({
  selector: 'app-admin-promos',
  standalone: true,
  imports: [FormsModule],
  host: { class: 'flex flex-col flex-1 min-h-0' },
  templateUrl: './admin-promos.component.html',
})
export class AdminPromosComponent implements OnInit {
  private promoService = inject(PromoService);

  promos = signal<Promo[]>([]);
  loading = signal(true);
  search = signal('');
  showModal = signal(false);
  editingPromo = signal<Promo | null>(null);
  saving = signal(false);
  error = signal('');

  // Form fields
  form = {
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    minOrderValue: 0,
    maxUses: null as number | null,
    expiresAt: '',
  };

  filteredPromos = computed(() => {
    const q = this.search().toLowerCase();
    if (!q) return this.promos();
    return this.promos().filter(p =>
      p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  });

  activeCount = computed(() => this.promos().filter(p => p.isActive && !this.isExpired(p)).length);
  totalRedemptions = computed(() => this.promos().reduce((s, p) => s + p.usedCount, 0));
  expiringSoon = computed(() => {
    const in7 = new Date(); in7.setDate(in7.getDate() + 7);
    return this.promos().filter(p => p.expiresAt && new Date(p.expiresAt) <= in7 && new Date(p.expiresAt) > new Date()).length;
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.promoService.getAllPromos().subscribe({
      next: p => { this.promos.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.editingPromo.set(null);
    this.form = { code: '', description: '', discountType: 'percentage', discountValue: 0, minOrderValue: 0, maxUses: null, expiresAt: '' };
    this.error.set('');
    this.showModal.set(true);
  }

  openEdit(p: Promo) {
    this.editingPromo.set(p);
    this.form = {
      code: p.code,
      description: p.description,
      discountType: p.discountType,
      discountValue: p.discountValue,
      minOrderValue: p.minOrderValue,
      maxUses: p.maxUses,
      expiresAt: p.expiresAt ? p.expiresAt.split('T')[0] : '',
    };
    this.error.set('');
    this.showModal.set(true);
  }

  save() {
    if (!this.form.code.trim() || !this.form.discountValue) {
      this.error.set('Code and discount value are required'); return;
    }
    this.saving.set(true);
    const body = {
      ...this.form,
      expiresAt: this.form.expiresAt ? new Date(this.form.expiresAt).toISOString() : null,
    };
    const editing = this.editingPromo();
    const req = editing
      ? this.promoService.updatePromo(editing._id, body)
      : this.promoService.createPromo(body);

    req.subscribe({
      next: () => { this.showModal.set(false); this.saving.set(false); this.load(); },
      error: (e) => { this.error.set(e.error?.error || 'Failed to save'); this.saving.set(false); },
    });
  }

  toggleActive(p: Promo) {
    this.promoService.updatePromo(p._id, { isActive: !p.isActive }).subscribe({
      next: updated => this.promos.update(list => list.map(x => x._id === p._id ? updated : x)),
    });
  }

  delete(p: Promo) {
    if (!confirm(`Delete promo code "${p.code}"?`)) return;
    this.promoService.deletePromo(p._id).subscribe({ next: () => this.load() });
  }

  isExpired(p: Promo) { return !!p.expiresAt && new Date(p.expiresAt) < new Date(); }
  isMaxed(p: Promo) { return p.maxUses !== null && p.usedCount >= p.maxUses; }

  statusLabel(p: Promo) {
    if (!p.isActive) return 'Inactive';
    if (this.isExpired(p)) return 'Expired';
    if (this.isMaxed(p)) return 'Maxed Out';
    return 'Active';
  }

  statusClass(p: Promo) {
    const s = this.statusLabel(p);
    if (s === 'Active') return 'bg-primary/10 text-primary';
    if (s === 'Expired' || s === 'Maxed Out') return 'bg-slate-100 text-slate-400';
    return 'bg-amber-50 text-amber-600';
  }

  usageWidth(p: Promo) {
    if (!p.maxUses) return '100%';
    return Math.min(100, Math.round((p.usedCount / p.maxUses) * 100)) + '%';
  }

  formatDate(d: string | null) {
    if (!d) return 'No expiry';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  copyCode(code: string) { navigator.clipboard.writeText(code); }
}
