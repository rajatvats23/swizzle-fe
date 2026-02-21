import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Promo {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PromoValidateResult {
  valid: boolean;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  finalTotal: number;
}

@Injectable({ providedIn: 'root' })
export class PromoService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/promo`;

  // Customer
  getActivePromos(): Observable<Promo[]> {
    return this.http.get<Promo[]>(`${this.api}/active`);
  }
  validatePromo(code: string, cartTotal: number): Observable<PromoValidateResult> {
    return this.http.post<PromoValidateResult>(`${this.api}/validate`, { code, cartTotal });
  }
  redeemPromo(code: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.api}/redeem`, { code });
  }

  // Admin CRUD
  getAllPromos(): Observable<Promo[]> {
    return this.http.get<Promo[]>(`${this.api}`);
  }
  createPromo(body: Partial<Promo>): Observable<Promo> {
    return this.http.post<Promo>(`${this.api}`, body);
  }
  updatePromo(id: string, body: Partial<Promo>): Observable<Promo> {
    return this.http.patch<Promo>(`${this.api}/${id}`, body);
  }
  deletePromo(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.api}/${id}`);
  }
}
