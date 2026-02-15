// src/app/core/services/menu.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, Product, Addon } from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/menu`;

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getProducts(categoryId?: string): Observable<Product[]> {
    const url = categoryId 
      ? `${this.apiUrl}/products?categoryId=${categoryId}`
      : `${this.apiUrl}/products`;
    return this.http.get<Product[]>(url);
  }

  getAddons(): Observable<Addon[]> {
    return this.http.get<Addon[]>(`${this.apiUrl}/addons`);
  }
}