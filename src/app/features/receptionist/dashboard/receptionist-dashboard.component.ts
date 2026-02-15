import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-receptionist-dashboard',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-6 relative overflow-hidden">
      
      <!-- Background Gradient Blobs -->
      <div class="fixed inset-0 -z-10 opacity-20 pointer-events-none">
        <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
        <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3"></div>
      </div>

      <!-- Main Card -->
      <div class="w-full max-w-[480px] bg-white dark:bg-background-dark/50 rounded-2xl shadow-xl border border-primary/5 p-12 flex flex-col items-center">
        
        <!-- Logo -->
        <div class="mb-8 flex items-center justify-center">
          <div class="size-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-3xl">storefront</span>
          </div>
        </div>

        <!-- Heading -->
        <div class="text-center mb-10">
          <h1 class="text-text-primary dark:text-white text-2xl font-bold leading-tight tracking-tight">
            Receptionist Dashboard
          </h1>
          <p class="text-text-secondary dark:text-primary/70 text-base font-normal mt-2">
            Take orders or send links to customers
          </p>
        </div>

        <!-- Success Message -->
        @if (successMessage()) {
          <div class="w-full mb-6 flex items-center bg-success text-white px-4 py-3 rounded-xl shadow-lg">
            <span class="material-symbols-outlined mr-3 text-[24px]">check_circle</span>
            <span class="flex-1 text-center font-medium">{{ successMessage() }}</span>
            <button (click)="successMessage.set('')" class="ml-2 hover:opacity-80">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        }

        <!-- Error Message -->
        @if (errorMessage()) {
          <div class="w-full mb-6 flex items-center bg-error text-white px-4 py-3 rounded-xl shadow-lg">
            <span class="material-symbols-outlined mr-3 text-[24px]">cancel</span>
            <span class="flex-1 text-center font-medium">{{ errorMessage() }}</span>
            <button (click)="errorMessage.set('')" class="ml-2 hover:opacity-80">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        }

        <!-- Form -->
        <div class="w-full space-y-6">
          <div class="flex flex-col gap-2">
            <label class="text-text-primary dark:text-white text-sm font-semibold ml-1">
              Phone Number
            </label>
            <div class="relative flex items-center group">
              <span class="absolute left-4 text-text-primary dark:text-white font-medium border-r pr-3"
                    [class.border-primary]="!phoneError()"
                    [class.border-error]="phoneError()"
                    [class.border-primary/20]="!phoneError()">
                +91
              </span>
              <input 
                type="tel"
                [(ngModel)]="phoneNumber"
                (input)="clearMessages()"
                maxlength="10"
                placeholder="98765 43210"
                class="w-full h-14 pl-16 pr-12 rounded-xl border transition-all text-text-primary dark:text-white placeholder:text-text-secondary/50"
                [class.border-primary/20]="!phoneError()"
                [class.focus:ring-2]="!phoneError()"
                [class.focus:ring-primary/20]="!phoneError()"
                [class.focus:border-primary]="!phoneError()"
                [class.border-error]="phoneError()"
                [class.border-2]="phoneError()"
                [class.bg-background-light/30]="!phoneError()"
                [class.dark:bg-background-dark/20]="!phoneError()"
              />
              @if (isValidPhone() && !phoneError()) {
                <div class="absolute right-4 text-primary flex items-center">
                  <span class="material-symbols-outlined font-bold">check_circle</span>
                </div>
              }
              @if (phoneError()) {
                <div class="absolute right-4 text-error flex items-center">
                  <span class="material-symbols-outlined">error</span>
                </div>
              }
            </div>
            @if (phoneError()) {
              <p class="text-error text-xs font-medium ml-1">{{ phoneError() }}</p>
            }
          </div>

          <!-- Buttons -->
          <div class="flex flex-col gap-4 pt-2">
            <button 
              (click)="sendLink()"
              [disabled]="loading()"
              class="w-full h-14 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-primary flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (loading()) {
                <span class="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                <span>Processing...</span>
              } @else {
                <span class="material-symbols-outlined text-xl">send</span>
                <span>Send Link</span>
              }
            </button>

            <button 
              (click)="takeOrder()"
              [disabled]="loading()"
              class="w-full h-14 bg-white dark:bg-transparent border-2 border-primary text-primary hover:bg-primary/5 font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="material-symbols-outlined text-xl">shopping_cart</span>
              <span>Take Order</span>
            </button>
          </div>
        </div>

        <!-- Footer Dots -->
        <div class="mt-10 flex gap-1 items-center opacity-40">
          <div class="h-1 w-8 bg-primary rounded-full"></div>
          <div class="h-1 w-2 bg-primary/30 rounded-full"></div>
          <div class="h-1 w-2 bg-primary/30 rounded-full"></div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ReceptionistDashboardComponent {
  private orderService = inject(OrderService);
  private router = inject(Router);

  phoneNumber = '';
  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  phoneError = signal('');

  isValidPhone(): boolean {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(this.phoneNumber);
  }

  private validatePhone(): boolean {
    if (!this.phoneNumber) {
      this.phoneError.set('Phone number is required');
      return false;
    }
    if (!this.isValidPhone()) {
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