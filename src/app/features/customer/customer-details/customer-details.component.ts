import { Component, signal, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-customer-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-details.component.html',
  styleUrl: './customer-details.component.scss'
})
export class CustomerDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);

  orderId = signal<string>('');
  phoneNumber = signal<string>('');
  customerName = '';
  loading = signal<boolean>(false);
  error = signal<string>('');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.orderId.set(id);
      this.fetchOrderDetails(id);
    } else {
      this.error.set('Invalid order link');
    }
  }

  fetchOrderDetails(orderId: string) {
    this.loading.set(true);
    this.error.set('');

    this.orderService.getOrder(orderId).subscribe({
      next: (order) => {
        this.phoneNumber.set(order.phoneNumber);

        // If customer name already exists, pre-fill it
        if (order.customerName) {
          this.customerName = order.customerName;
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load order details:', err);
        this.error.set('Failed to load order details. Please try again.');
        this.loading.set(false);
      }
    });
  }

  skipToMenu() {
    this.router.navigate(['/order', this.orderId(), 'menu']);
  }

  continue() {
    const name = this.customerName.trim();

    console.log('Continue clicked!'); // ADD THIS

    if (!name) {
      this.error.set('Please enter your name');
      return;
    }

    if (name.length < 2) {
      this.error.set('Name must be at least 2 characters');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const phone = this.phoneNumber();
    console.log('About to send OTP to:', phone); // ADD THIS

    // Send OTP
    this.orderService.sendOtp(phone).subscribe({
      next: (response) => {
        console.log('✅ OTP API Response:', response); // ADD THIS
        this.loading.set(false);

        const orderId = this.orderId();
        console.log('Navigating to /order/' + orderId + '/verify-otp'); // ADD THIS

        // Navigate to OTP verification page
        this.router.navigate(['/order', orderId, 'verify-otp'], {
          state: {
            phoneNumber: phone,
            customerName: name
          }
        }).then(
          (navigated) => {
            console.log('✅ Navigation result:', navigated);
          }
        ).catch(err => {
          console.error('❌ Navigation failed:', err);
        });
      },
      error: (err) => {
        console.error('❌ OTP API Error:', err); // ADD THIS
        this.error.set('Failed to send OTP. Please try again.');
        this.loading.set(false);
      },
      complete: () => {
        console.log('OTP observable completed'); // ADD THIS
      }
    });
  }
}