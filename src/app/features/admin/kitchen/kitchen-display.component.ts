import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { SocketService } from '../../../core/services/socket.service';
import { AdminOrder, OrderStatus } from '../../../core/models/order.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-kitchen-display',
  standalone: true,
  imports: [FormsModule],
  host: { class: 'flex flex-col flex-1 min-h-0' },
  templateUrl: './kitchen-display.component.html',
})
export class KitchenDisplayComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private socketService = inject(SocketService);
  private subs: Subscription[] = [];

  orders = signal<AdminOrder[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  activeFilter = signal<string>('all');
  currentTime = signal(new Date());
  private timerInterval: any;

  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filters: only kitchen-relevant statuses
  filters = [
    { key: 'all', label: 'All Active' },
    { key: 'CONFIRMED', label: 'New' },
    { key: 'PREPARING', label: 'Preparing' },
    { key: 'READY', label: 'Ready' },
  ];

  filteredOrders = computed(() => {
    let list = this.orders();
    const filter = this.activeFilter();
    const q = this.searchQuery().toLowerCase().trim();

    // Only show kitchen-relevant statuses
    list = list.filter(o =>
      ['CONFIRMED', 'PAID', 'PREPARING', 'READY'].includes(o.status)
    );

    if (filter !== 'all') {
      if (filter === 'CONFIRMED') {
        list = list.filter(o => o.status === 'CONFIRMED' || o.status === 'PAID');
      } else {
        list = list.filter(o => o.status === filter);
      }
    }

    if (q) {
      list = list.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.customerName || '').toLowerCase().includes(q)
      );
    }

    return list;
  });

  statusCounts = computed(() => {
    const all = this.orders().filter(o =>
      ['CONFIRMED', 'PAID', 'PREPARING', 'READY'].includes(o.status)
    );
    return {
      all: all.length,
      new: all.filter(o => o.status === 'CONFIRMED' || o.status === 'PAID').length,
      preparing: all.filter(o => o.status === 'PREPARING').length,
      ready: all.filter(o => o.status === 'READY').length,
    };
  });

  ngOnInit() {
    this.loadOrders();

    // Live clock for elapsed time
    this.timerInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);

    // Socket: listen for new and updated orders
    this.subs.push(
      this.socketService.on<AdminOrder>('order:new').subscribe(order => {
        this.orders.update(list => [order, ...list]);
      }),
      this.socketService.on<AdminOrder>('order:updated').subscribe(updated => {
        this.orders.update(list =>
          list.map(o => o._id === updated._id ? updated : o)
        );
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  loadOrders() {
    this.loading.set(true);
    this.adminService.getAllOrders().subscribe({
      next: orders => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showToast('Failed to load orders', 'error');
      },
    });
  }

  // ── Status Actions ─────────────────────────────────────────────────────

  startPreparing(order: AdminOrder) {
    this.updateStatus(order, OrderStatus.PREPARING);
  }

  markReady(order: AdminOrder) {
    this.updateStatus(order, OrderStatus.READY);
  }

  markDelivered(order: AdminOrder) {
    this.updateStatus(order, OrderStatus.DELIVERED);
  }

  private updateStatus(order: AdminOrder, status: OrderStatus) {
    this.adminService.updateOrderStatus(order._id, status).subscribe({
      next: updated => {
        this.orders.update(list =>
          list.map(o => o._id === updated._id ? updated : o)
        );
        this.showToast(`Order #${updated.orderNumber} → ${status}`, 'success');
      },
      error: () => this.showToast('Failed to update status', 'error'),
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  getElapsedMinutes(createdAt: string): number {
    const diff = this.currentTime().getTime() - new Date(createdAt).getTime();
    return Math.floor(diff / 60000);
  }

  getElapsedDisplay(createdAt: string): string {
    const mins = this.getElapsedMinutes(createdAt);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  }

  getUrgencyClass(createdAt: string): string {
    const mins = this.getElapsedMinutes(createdAt);
    if (mins >= 15) return 'text-red-600 font-bold';
    if (mins >= 10) return 'text-amber-600 font-bold';
    return 'text-gray-900 font-bold';
  }

  getBorderColor(order: AdminOrder): string {
    if (order.status === 'READY') return 'border-t-blue-500';
    if (order.status === 'PREPARING') return 'border-t-primary';
    const mins = this.getElapsedMinutes(order.createdAt);
    if (mins >= 15) return 'border-t-red-500';
    if (mins >= 10) return 'border-t-amber-500';
    return 'border-t-gray-300';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'CONFIRMED': case 'PAID': return 'New';
      case 'PREPARING': return 'Preparing';
      case 'READY': return 'Ready';
      default: return status;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'CONFIRMED': case 'PAID': return 'bg-amber-100 text-amber-700';
      case 'PREPARING': return 'bg-primary/10 text-primary';
      case 'READY': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  getAddonNames(addons: any[]): string {
    return addons.map(a => a.addonName).join(', ');
  }

  private showToast(message: string, type: 'success' | 'error') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }
}
