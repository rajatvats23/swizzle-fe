import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { AnalyticsData } from '../../../core/models/order.model';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [],
  templateUrl: './admin-analytics.component.html',
  host: { class: 'flex flex-col flex-1 min-h-0' },
})
export class AdminAnalyticsComponent implements OnInit {
  private adminService = inject(AdminService);

  analytics = signal<AnalyticsData | null>(null);
  loading = signal(true);
  error = signal(false);

  // Derived: max daily count for bar height scaling
  maxDailyCount = computed(() => {
    const data = this.analytics();
    if (!data) return 1;
    return Math.max(...data.dailyOrders.map(d => d.count), 1);
  });

  // Stat cards
  statCards = computed(() => {
    const d = this.analytics();
    if (!d) return [];
    return [
      { label: 'Total Orders', value: d.totalOrders.toString(), icon: 'receipt_long', color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Total Revenue', value: '₹' + d.totalRevenue.toFixed(2), icon: 'currency_rupee', color: 'text-green-600', bg: 'bg-green-50' },
      { label: 'Paid Orders', value: d.paidOrders.toString(), icon: 'payments', color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: "Today's Orders", value: d.todayOrders.toString(), icon: 'today', color: 'text-purple-600', bg: 'bg-purple-50' },
    ];
  });

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.loading.set(true);
    this.error.set(false);
    this.adminService.getAnalytics().subscribe({
      next: data => {
        this.analytics.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  barHeightPercent(count: number): number {
    const max = this.maxDailyCount();
    return max === 0 ? 0 : Math.round((count / max) * 100);
  }

  formatDay(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
  }

  formatCurrency(amount: number): string {
    return '₹' + (amount ?? 0).toFixed(2);
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

  statusEntries(): { key: string; count: number }[] {
    const d = this.analytics();
    if (!d) return [];
    return Object.entries(d.statusCounts).map(([key, count]) => ({ key, count }));
  }
}
