import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminOrder, AnalyticsData, Customer, OrderStatus } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/admin`;

  getAllOrders(status?: string, search?: string): Observable<AdminOrder[]> {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    if (search) params['search'] = search;
    return this.http.get<AdminOrder[]>(`${this.api}/orders`, { params });
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Observable<AdminOrder> {
    return this.http.patch<AdminOrder>(`${this.api}/orders/${orderId}/status`, { status });
  }

  getAnalytics(): Observable<AnalyticsData> {
    return this.http.get<AnalyticsData>(`${this.api}/analytics`);
  }

  getCustomers(search?: string): Observable<Customer[]> {
    const params: Record<string, string> = {};
    if (search) params['search'] = search;
    return this.http.get<Customer[]>(`${this.api}/customers`, { params });
  }
}
