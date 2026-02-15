// src/app/test-menu.component.ts
import { Component, inject, signal } from '@angular/core';
import { MenuService } from './core/services/menu.service';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-test-menu',
  standalone: true,
  imports: [JsonPipe],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold mb-4">Menu API Test</h1>
      
      <button (click)="testCategories()" class="bg-blue-500 text-white px-4 py-2 rounded mr-2">
        Test Categories
      </button>
      <button (click)="testProducts()" class="bg-green-500 text-white px-4 py-2 rounded mr-2">
        Test Products
      </button>
      <button (click)="testAddons()" class="bg-purple-500 text-white px-4 py-2 rounded">
        Test Addons
      </button>

      @if (categories()) {
        <div class="mt-4">
          <h2 class="font-bold">Categories ({{ categories()?.length }}):</h2>
          <pre class="bg-gray-100 p-2 text-xs overflow-auto">{{ categories() | json }}</pre>
        </div>
      }

      @if (products()) {
        <div class="mt-4">
          <h2 class="font-bold">Products ({{ products()?.length }}):</h2>
          <pre class="bg-gray-100 p-2 text-xs overflow-auto">{{ products() | json }}</pre>
        </div>
      }

      @if (addons()) {
        <div class="mt-4">
          <h2 class="font-bold">Addons ({{ addons()?.length }}):</h2>
          <pre class="bg-gray-100 p-2 text-xs overflow-auto">{{ addons() | json }}</pre>
        </div>
      }

      @if (error()) {
        <div class="mt-4 bg-red-100 text-red-700 p-3 rounded">
          Error: {{ error() }}
        </div>
      }
    </div>
  `
})
export class TestMenuComponent {
  private menuService = inject(MenuService);

  categories = signal<any>(null);
  products = signal<any>(null);
  addons = signal<any>(null);
  error = signal('');

  testCategories() {
    this.menuService.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: (err) => this.error.set(err.message)
    });
  }

  testProducts() {
    this.menuService.getProducts().subscribe({
      next: (data) => this.products.set(data),
      error: (err) => this.error.set(err.message)
    });
  }

  testAddons() {
    this.menuService.getAddons().subscribe({
      next: (data) => this.addons.set(data),
      error: (err) => this.error.set(err.message)
    });
  }
}