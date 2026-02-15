import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../models/order.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/receptionist/orders`;

  initiateOrder(phoneNumber: string): Observable<{ orderId: string; orderNumber: string }> {
    return this.http.post<{ orderId: string; orderNumber: string }>(
      `${this.apiUrl}/initiate`,
      { phoneNumber }
    );
  }

  sendLink(orderId: string, phoneNumber: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/send-link`,
      { orderId, phoneNumber }
    );
  }

  getOrder(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${environment.apiUrl}/orders/${orderId}`);
  }
}