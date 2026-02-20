import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent implements OnInit {
  notifService = inject(NotificationService);

  sidebarCollapsed = signal(false);
  notifOpen = signal(false);

  ngOnInit() {
    this.notifService.start();
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleNotifPanel() {
    this.notifOpen.update(v => !v);
    if (this.notifOpen()) {
      this.notifService.markAllRead();
    }
  }

  closeNotifPanel() {
    this.notifOpen.set(false);
  }

  navItems = [
    { icon: 'restaurant_menu', label: 'Menu', route: '/admin/menu' },
    { icon: 'tune', label: 'Addons', route: '/admin/addons' },
    { icon: 'receipt_long', label: 'Orders', route: '/admin/orders' },
    { icon: 'bar_chart', label: 'Analytics', route: '/admin/analytics' },
    { icon: 'group', label: 'Customers', route: '/admin/customers' },
  ];

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  formatCurrency(amount: number): string {
    return '₹' + (amount ?? 0).toFixed(2);
  }
}
