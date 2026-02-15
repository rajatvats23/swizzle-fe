// src/app/features/customer/customer-details/customer-details.component.ts

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
})
export class CustomerDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  
  orderId = signal<string>('');
  phoneNumber = signal<string>('');
  customerName = signal<string>('');
  loading = signal<boolean>(false);
  error = signal<string>('');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.orderId.set(id);
      this.fetchOrderDetails(id);
    }
  }

  fetchOrderDetails(orderId: string) {
    this.loading.set(true);
    this.orderService.getOrder(orderId).subscribe({
      next: (order) => {
        this.phoneNumber.set(order.phoneNumber);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load order details');
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  skipToMenu() {
    this.router.navigate(['/order', this.orderId(), 'menu']);
  }

  continue() {
    const name = this.customerName().trim();
    
    if (!name) {
      this.error.set('Please enter your name');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.orderService.sendOtp(this.phoneNumber()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/order', this.orderId(), 'verify-otp'], {
          state: { 
            phoneNumber: this.phoneNumber(),
            customerName: name 
          }
        });
      },
      error: (err) => {
        this.error.set('Failed to send OTP. Please try again.');
        console.error(err);
        this.loading.set(false);
      }
    });
  }
}