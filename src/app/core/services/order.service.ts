// src/app/core/services/order.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, CartItem } from '../models/order.model';

export interface OtpResponse {
  success: boolean;
}

export interface OtpVerifyResponse {
  verified: boolean;
}

export interface CheckoutResponse {
  stripeSessionUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`;
  private otpUrl = `${environment.apiUrl}/otp`;

  getOrder(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${orderId}`);
  }

  sendOtp(phoneNumber: string): Observable<OtpResponse> {
    return this.http.post<OtpResponse>(`${this.otpUrl}/send`, { phoneNumber });
  }

  verifyOtp(phoneNumber: string, otp: string): Observable<OtpVerifyResponse> {
    return this.http.post<OtpVerifyResponse>(`${this.otpUrl}/verify`, {
      phoneNumber,
      otp
    });
  }

  updateCustomerDetails(orderId: string, data: { customerName?: string, deliveryAddress?: any }): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${orderId}/details`, data);
  }

  initiateOrder(phoneNumber: string): Observable<{ orderId: string; orderNumber: string }> {
    return this.http.post<{ orderId: string; orderNumber: string }>(
      `${environment.apiUrl}/receptionist/orders/initiate`,
      { phoneNumber }
    );
  }

  sendLink(orderId: string, phoneNumber: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${environment.apiUrl}/receptionist/orders/send-link`,
      { orderId, phoneNumber }
    );
  }

  // Cart Management APIs
  addItemToOrder(orderId: string, item: CartItem): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/${orderId}/items`, item);
  }

  updateItemQuantity(orderId: string, itemId: string, quantity: number): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${orderId}/items/${itemId}`, { quantity });
  }

  removeItemFromOrder(orderId: string, itemId: string): Observable<Order> {
    return this.http.delete<Order>(`${this.apiUrl}/${orderId}/items/${itemId}`);
  }

  /**
   * ✅ UPDATED: Checkout - Only sends total, backend validates against DB
   */
  checkout(orderId: string, total: number): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(
      `${this.apiUrl}/${orderId}/checkout`,
      { total }
    );
  }
}