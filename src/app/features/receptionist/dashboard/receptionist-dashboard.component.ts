import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-receptionist-dashboard',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-800">New Order</h1>
            <p class="text-sm text-slate-500">Enter customer phone number</p>
          </div>
        </div>

        @if (successMessage()) {
          <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {{ successMessage() }}
          </div>
        }

        @if (errorMessage()) {
          <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {{ errorMessage() }}
          </div>
        }

        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
          <input 
            type="tel" 
            [(ngModel)]="phoneNumber"
            (input)="clearMessages()"
            placeholder="10-digit mobile number"
            maxlength="10"
            class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
          @if (phoneError()) {
            <p class="text-red-500 text-xs mt-1">{{ phoneError() }}</p>
          }
        </div>

        <div class="space-y-3">
          <button 
            (click)="sendLink()"
            [disabled]="loading()"
            class="w-full bg-primary text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            @if (loading()) {
              <span>Processing...</span>
            } @else {
              <span>Send Link via SMS</span>
            }
          </button>

          <button 
            (click)="takeOrder()"
            [disabled]="loading()"
            class="w-full border-2 border-primary text-primary py-3 rounded-lg font-medium hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Take Order (Assisted)
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary: #0da04d;
    }
  `]
})
export class ReceptionistDashboardComponent {
  private orderService = inject(OrderService);
  private router = inject(Router);

  phoneNumber = '';
  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  phoneError = signal('');

  private validatePhone(): boolean {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!this.phoneNumber) {
      this.phoneError.set('Phone number is required');
      return false;
    }
    if (!phoneRegex.test(this.phoneNumber)) {
      this.phoneError.set('Enter valid 10-digit mobile number');
      return false;
    }
    this.phoneError.set('');
    return true;
  }

  clearMessages() {
    this.successMessage.set('');
    this.errorMessage.set('');
    this.phoneError.set('');
  }

  sendLink() {
    if (!this.validatePhone()) return;

    this.loading.set(true);
    this.orderService.initiateOrder(this.phoneNumber).subscribe({
      next: ({ orderId }) => {
        this.orderService.sendLink(orderId, this.phoneNumber).subscribe({
          next: () => {
            this.loading.set(false);
            this.successMessage.set('Order link sent successfully!');
            this.phoneNumber = '';
          },
          error: () => {
            this.loading.set(false);
            this.errorMessage.set('Failed to send link. Try again.');
          }
        });
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Failed to create order. Try again.');
      }
    });
  }

  takeOrder() {
    if (!this.validatePhone()) return;

    this.loading.set(true);
    this.orderService.initiateOrder(this.phoneNumber).subscribe({
      next: ({ orderId }) => {
        this.loading.set(false);
        this.router.navigate(['/order', orderId]);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Failed to create order. Try again.');
      }
    });
  }
}