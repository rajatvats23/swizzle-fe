import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Customer } from '../../../core/models/order.model';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-customers.component.html',
  host: { class: 'flex flex-col flex-1 min-h-0' },
})
export class AdminCustomersComponent implements OnInit {
  private adminService = inject(AdminService);

  customers = signal<Customer[]>([]);
  loading = signal(true);
  searchQuery = signal('');

  filteredCustomers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.customers();
    return this.customers().filter(c =>
      c.phoneNumber.includes(q) ||
      (c.customerName ?? '').toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading.set(true);
    this.adminService.getCustomers().subscribe({
      next: customers => {
        this.customers.set(customers);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatCurrency(amount: number): string {
    return '₹' + (amount ?? 0).toFixed(2);
  }

  // How many of this customer's orders were paid/confirmed
  paidCount(c: Customer): number {
    return c.statuses.filter(s => s === 'PAID' || s === 'CONFIRMED').length;
  }

  isRepeat(c: Customer): boolean {
    return c.totalOrders >= 3;
  }

  initials(c: Customer): string {
    const name = c.customerName?.trim();
    if (!name) return c.phoneNumber.slice(-2);
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  avatarColor(phone: string): string {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-purple-100 text-purple-700',
      'bg-emerald-100 text-emerald-700',
      'bg-orange-100 text-orange-700',
      'bg-pink-100 text-pink-700',
      'bg-teal-100 text-teal-700',
    ];
    const idx = parseInt(phone.slice(-1), 10) % colors.length;
    return colors[idx];
  }
}
