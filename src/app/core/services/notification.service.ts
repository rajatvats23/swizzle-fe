import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SocketService } from './socket.service';
import { AdminOrder } from '../models/order.model';

const MAX_NOTIFICATIONS = 20;

export interface OrderNotification {
  order: AdminOrder;
  seenAt: Date;
  isRead: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private socketService = inject(SocketService);
  private sub: Subscription | null = null;
  private initialized = false;

  notifications = signal<OrderNotification[]>([]);

  unreadCount = computed(() =>
    this.notifications().filter(n => !n.isRead).length
  );

  /** Call once from the layout component on init */
  start() {
    if (this.initialized) return;
    this.initialized = true;

    this.sub = this.socketService.on<AdminOrder>('order:new').subscribe(order => {
      const notif: OrderNotification = {
        order,
        seenAt: new Date(),
        isRead: false,
      };
      this.notifications.update(existing => [notif, ...existing].slice(0, MAX_NOTIFICATIONS));
    });
  }

  markAllRead() {
    this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
  }

  clearAll() {
    this.notifications.set([]);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
