import { Component, signal, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-customer-details',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './customer-details.component.html',
})
export class CustomerDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);

  orderId = signal('');
  phoneNumber = signal('');
  customerName = '';
  loading = signal(false);
  error = signal('');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.orderId.set(id);
      this.loading.set(true);
      this.orderService.getOrder(id).subscribe({
        next: order => {
          this.phoneNumber.set(order.phoneNumber);
          if (order.customerName) this.customerName = order.customerName;
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load order details. Please try again.');
          this.loading.set(false);
        },
      });
    } else {
      this.error.set('Invalid order link');
    }
  }

  skipToMenu() {
    this.router.navigate(['/order', this.orderId(), 'menu']);
  }

  continue() {
    const name = this.customerName.trim();
    if (!name || name.length < 2) {
      this.error.set('Please enter your full name (min 2 characters)');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.orderService.sendOtp(this.phoneNumber()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/order', this.orderId(), 'verify-otp'], {
          state: { phoneNumber: this.phoneNumber(), customerName: name },
        });
      },
      error: () => {
        this.error.set('Failed to send OTP. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
