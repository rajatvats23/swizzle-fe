import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AdminOrder, OrderStatus } from '../../../core/models/order.model';
import { AdminService } from '../../../core/services/admin.service';
import { SocketService } from '../../../core/services/socket.service';

type StatusFilter = '' | 'INITIATED' | 'IN_PROGRESS' | 'PAYMENT_PENDING' | 'PAID' | 'CONFIRMED';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-orders.component.html',
  host: { class: 'flex flex-col flex-1 min-h-0' },
})
export class AdminOrdersComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private socketService = inject(SocketService);
  private subs: Subscription[] = [];

  orders = signal<AdminOrder[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  statusFilter = signal<StatusFilter>('');
  expandedOrderId = signal<string | null>(null);
  updatingStatusId = signal<string | null>(null);
  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);
  newOrderBadge = signal(false);

  readonly statusTabs: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: '' },
    { label: 'Initiated', value: 'INITIATED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Pending Payment', value: 'PAYMENT_PENDING' },
    { label: 'Paid', value: 'PAID' },
    { label: 'Confirmed', value: 'CONFIRMED' },
  ];

  readonly allStatuses: OrderStatus[] = [
    OrderStatus.INITIATED,
    OrderStatus.IN_PROGRESS,
    OrderStatus.PAYMENT_PENDING,
    OrderStatus.PAID,
    OrderStatus.CONFIRMED,
  ];

  filteredOrders = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sf = this.statusFilter();
    let list = this.orders();
    if (sf) list = list.filter(o => o.status === sf);
    if (q) list = list.filter(o =>
      o.orderNumber?.toLowerCase().includes(q) ||
      o.phoneNumber?.includes(q) ||
      (o.customerName ?? '').toLowerCase().includes(q)
    );
    return list;
  });

  ngOnInit() {
    this.loadOrders();
    this.listenToSocket();
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  private listenToSocket() {
    // New order arrives → prepend to list
    this.subs.push(
      this.socketService.on<AdminOrder>('order:new').subscribe(order => {
        this.orders.update(list => [order, ...list]);
        this.newOrderBadge.set(true);
        this.showToast(`New order: ${order.orderNumber}`, 'success');
        setTimeout(() => this.newOrderBadge.set(false), 5000);
      })
    );

    // Existing order updated → patch in-place
    this.subs.push(
      this.socketService.on<AdminOrder>('order:updated').subscribe(updated => {
        this.orders.update(list => {
          const idx = list.findIndex(o => o._id === (updated._id as any)?.toString?.() || updated._id);
          if (idx === -1) return list; // not in our list yet, ignore
          const copy = [...list];
          copy[idx] = { ...copy[idx], ...updated };
          return copy;
        });
      })
    );
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

  toggleExpand(orderId: string) {
    this.expandedOrderId.update(id => id === orderId ? null : orderId);
  }

  setStatusFilter(value: StatusFilter) {
    this.statusFilter.set(value);
    this.expandedOrderId.set(null);
  }

  updateStatus(order: AdminOrder, newStatus: OrderStatus) {
    if (order.status === newStatus) return;
    this.updatingStatusId.set(order._id);
    this.adminService.updateOrderStatus(order._id, newStatus).subscribe({
      next: updated => {
        // Socket will also fire order:updated — but patching locally too for instant feel
        this.orders.update(list => list.map(o => o._id === updated._id ? updated : o));
        this.updatingStatusId.set(null);
        this.showToast(`Order ${order.orderNumber} → ${this.statusLabel(newStatus)}`, 'success');
      },
      error: () => {
        this.updatingStatusId.set(null);
        this.showToast('Failed to update status', 'error');
      },
    });
  }

  // ── CSV Export ────────────────────────────────────────────────────────────────
  exportCSV() {
    const rows = this.filteredOrders();
    if (rows.length === 0) return;

    const headers = ['Order #', 'Customer', 'Phone', 'Items', 'Total', 'Status', 'Type', 'Date'];
    const csvRows = [
      headers.join(','),
      ...rows.map(o => [
        o.orderNumber,
        `"${o.customerName ?? ''}"`,
        o.phoneNumber,
        o.items.length,
        o.total.toFixed(2),
        o.status,
        o.isAssistedOrder ? 'Assisted' : 'Self-service',
        `"${this.formatDate(o.createdAt)}"`,
      ].join(',')),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('CSV exported', 'success');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  statusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      INITIATED: 'bg-gray-100 text-gray-600',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      PAYMENT_PENDING: 'bg-yellow-100 text-yellow-700',
      PAID: 'bg-green-100 text-green-700',
      CONFIRMED: 'bg-emerald-100 text-emerald-800',
    };
    return map[status] ?? 'bg-gray-100 text-gray-500';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      INITIATED: 'Initiated',
      IN_PROGRESS: 'In Progress',
      PAYMENT_PENDING: 'Pending Payment',
      PAID: 'Paid',
      CONFIRMED: 'Confirmed',
    };
    return map[status] ?? status;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  formatCurrency(amount: number): string {
    return '₹' + (amount ?? 0).toFixed(2);
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }

  // ── Print Kitchen Ticket ──────────────────────────────────────────────────────
  printOrder(order: AdminOrder, event: Event) {
    event.stopPropagation();

    const itemRows = order.items.map(item => `
      <tr>
        <td style="padding:6px 0; font-size:14px; border-bottom:1px dashed #ccc;">
          <strong>${item.quantity}×</strong> ${item.productName}
          ${item.selectedAddons.length > 0
            ? `<br><span style="font-size:11px;color:#666;">+ ${item.selectedAddons.map(a => a.addonName).join(', ')}</span>`
            : ''}
        </td>
        <td style="padding:6px 0; font-size:14px; text-align:right; border-bottom:1px dashed #ccc; white-space:nowrap;">
          ₹${item.itemTotal.toFixed(2)}
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Kitchen Ticket — ${order.orderNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; width: 300px; padding: 16px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 12px; }
          .header h1 { font-size: 20px; font-weight: bold; }
          .header p { font-size: 12px; color: #444; margin-top: 2px; }
          .order-meta { font-size: 12px; margin-bottom: 12px; line-height: 1.6; }
          .order-meta .label { color: #666; }
          table { width: 100%; border-collapse: collapse; }
          .total-row td { padding-top: 8px; font-size: 15px; font-weight: bold; border-top: 2px solid #000; }
          .footer { text-align: center; margin-top: 14px; font-size: 11px; color: #666; border-top: 1px dashed #ccc; padding-top: 10px; }
          @media print {
            @page { margin: 0; size: 80mm auto; }
            body { width: 72mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍽 Swizzle</h1>
          <p>Kitchen Ticket</p>
        </div>
        <div class="order-meta">
          <div><span class="label">Order # </span><strong>${order.orderNumber}</strong></div>
          <div><span class="label">Customer: </span>${order.customerName || order.phoneNumber}</div>
          <div><span class="label">Type: </span>${order.isAssistedOrder ? 'Assisted' : 'Self-service'}</div>
          ${order.deliveryAddress?.text ? `<div><span class="label">Address: </span>${order.deliveryAddress.text}</div>` : ''}
          <div><span class="label">Time: </span>${this.formatDate(order.createdAt)}</div>
        </div>
        <table>
          ${itemRows}
          <tr class="total-row">
            <td>TOTAL</td>
            <td style="text-align:right;">₹${order.total.toFixed(2)}</td>
          </tr>
        </table>
        <div class="footer">Thank you! — Printed ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  }
}
