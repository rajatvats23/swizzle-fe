import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-otp.component.html',
  styleUrl: './verify-otp.component.scss'  // ← ADD THIS
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
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
  
  private timerInterval?: number;

  ngOnInit() {
    console.log('🔵 VerifyOtpComponent initialized'); // DEBUG
    
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.orderId.set(id);
    }

    // Get data from history.state (passed via router.navigate)
    const state = window.history.state;
    console.log('📦 Navigation state:', state); // DEBUG
    
    if (state.phoneNumber) {
      this.phoneNumber.set(state.phoneNumber);
      console.log('✅ Phone from state:', state.phoneNumber);
    }
    
    if (state.customerName) {
      this.customerName.set(state.customerName);
      console.log('✅ Name from state:', state.customerName);
    }

    // If no phone number, redirect back
    if (!this.phoneNumber()) {
      console.log('❌ No phone number, redirecting back');
      this.router.navigate(['/order', id, 'details']);
      return;
    }

    this.startResendTimer();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  startResendTimer() {
    this.clearTimer();
    this.canResend.set(false);
    this.resendTimer.set(30);

    this.timerInterval = window.setInterval(() => {
      const current = this.resendTimer();
      if (current <= 1) {
        this.clearTimer();
        this.canResend.set(true);
        this.resendTimer.set(0);
      } else {
        this.resendTimer.set(current - 1);
      }
    }, 1000);
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
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
    const value = input.value.replace(/\D/g, '');
    this.otp.set(value.slice(0, 6));
  }

  goBack() {
    this.router.navigate(['/order', this.orderId(), 'details']);
  }
}