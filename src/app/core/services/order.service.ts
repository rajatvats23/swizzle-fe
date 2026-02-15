// src/app/core/services/order.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Order {
  _id: string;
  orderNumber: string;
  phoneNumber: string;
  customerName?: string;
  deliveryAddress?: {
    text: string;
    lat: number;
    lng: number;
  };
  items: any[];
  status: string;
  total: number;
}

export interface OtpResponse {
  success: boolean;
}

export interface OtpVerifyResponse {
  verified: boolean;
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
}