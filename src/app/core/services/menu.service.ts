import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, Product, Addon } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/menu`;

  // Categories
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.api}/categories?all=true`);
  }
  createCategory(body: { name: string; displayOrder?: number }): Observable<Category> {
    return this.http.post<Category>(`${this.api}/categories`, body);
  }
  updateCategory(id: string, body: Partial<Pick<Category, 'name' | 'displayOrder'> & { isActive: boolean }>): Observable<Category> {
    return this.http.patch<Category>(`${this.api}/categories/${id}`, body);
  }
  deleteCategory(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.api}/categories/${id}`);
  }

  // Products
  getProducts(categoryId?: string): Observable<Product[]> {
    const qs = categoryId ? `?all=true&categoryId=${categoryId}` : '?all=true';
    return this.http.get<Product[]>(`${this.api}/products${qs}`);
  }
  createProduct(body: Omit<Product, '_id' | 'categoryName'>): Observable<Product> {
    return this.http.post<Product>(`${this.api}/products`, body);
  }
  updateProduct(id: string, body: Partial<Omit<Product, '_id' | 'categoryName'>>): Observable<Product> {
    return this.http.patch<Product>(`${this.api}/products/${id}`, body);
  }
  deleteProduct(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.api}/products/${id}`);
  }

  // Addons
  getAddons(): Observable<Addon[]> {
    return this.http.get<Addon[]>(`${this.api}/addons?all=true`);
  }
  createAddon(body: { name: string; type: 'single' | 'multiple'; options: { name: string; price: number }[] }): Observable<Addon> {
    return this.http.post<Addon>(`${this.api}/addons`, body);
  }
  updateAddon(id: string, body: Partial<Addon>): Observable<Addon> {
    return this.http.patch<Addon>(`${this.api}/addons/${id}`, body);
  }
  deleteAddon(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.api}/addons/${id}`);
  }
}
