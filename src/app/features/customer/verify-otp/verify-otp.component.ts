// src/app/features/customer/verify-otp/verify-otp.component.ts

import { Component, signal, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-otp.component.html',
})
export class VerifyOtpComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  
  orderId = signal<string>('');
  phoneNumber = signal<string>('');
  customerName = signal<string>('');
  otp = signal<string>('');
  loading = signal<boolean>(false);
  error = signal<string>('');
  resendTimer = signal<number>(30);
  canResend = signal<boolean>(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const navigation = this.router.getCurrentNavigation();
    
    if (id) {
      this.orderId.set(id);
    }

    // Get data passed from previous page
    if (navigation?.extras.state) {
      this.phoneNumber.set(navigation.extras.state['phoneNumber'] || '');
      this.customerName.set(navigation.extras.state['customerName'] || '');
    }

    // If no phone number, redirect back
    if (!this.phoneNumber()) {
      this.router.navigate(['/order', id, 'details']);
      return;
    }

    this.startResendTimer();
  }

  startResendTimer() {
    this.canResend.set(false);
    this.resendTimer.set(30);

    const interval = setInterval(() => {
      const current = this.resendTimer();
      if (current <= 1) {
        clearInterval(interval);
        this.canResend.set(true);
        this.resendTimer.set(0);
      } else {
        this.resendTimer.set(current - 1);
      }
    }, 1000);
  }

  resendOtp() {
    if (!this.canResend()) return;

    this.loading.set(true);
    this.error.set('');

    this.orderService.sendOtp(this.phoneNumber()).subscribe({
      next: () => {
        this.loading.set(false);
        this.startResendTimer();
        this.otp.set('');
      },
      error: (err) => {
        this.error.set('Failed to resend OTP');
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  verifyOtp() {
    const otpValue = this.otp().trim();

    if (!otpValue || otpValue.length !== 6) {
      this.error.set('Please enter a valid 6-digit OTP');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.orderService.verifyOtp(this.phoneNumber(), otpValue).subscribe({
      next: (response) => {
        if (response.verified) {
          // Update customer name in backend
          this.orderService.updateCustomerDetails(this.orderId(), {
            customerName: this.customerName()
          }).subscribe({
            next: () => {
              this.loading.set(false);
              // Navigate to address page
              this.router.navigate(['/order', this.orderId(), 'address']);
            },
            error: (err) => {
              this.error.set('Failed to save details');
              console.error(err);
              this.loading.set(false);
            }
          });
        } else {
          this.error.set('Invalid OTP. Please try again.');
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.error.set('Verification failed. Please try again.');
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  onOtpInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, ''); // Only digits
    this.otp.set(value.slice(0, 6)); // Max 6 digits
  }

  goBack() {
    this.router.navigate(['/order', this.orderId(), 'details']);
  }
}