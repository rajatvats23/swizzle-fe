import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-receptionist-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './receptionist-dashboard.component.html',
  styleUrl: './receptionist-dashboard.component.scss',
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
      next: (response: { orderId: string; orderNumber: string }) => {
        const { orderId } = response;
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
      next: (response: { orderId: string; orderNumber: string }) => {
        const { orderId } = response;
        this.loading.set(false);
        // Navigate to address instead of menu
        this.router.navigate(['/order', orderId, 'address']);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Failed to create order. Try again.');
      }
    });
  }
}