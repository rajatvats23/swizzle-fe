import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [],
  templateUrl: './verify-otp.component.html',
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);

  orderId = signal('');
  phoneNumber = signal('');
  customerName = signal('');
  otp = signal('');
  loading = signal(false);
  error = signal('');
  resendTimer = signal(30);
  canResend = signal(false);

  private timerInterval?: number;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.orderId.set(id);

    const state = window.history.state;
    if (state?.phoneNumber) this.phoneNumber.set(state.phoneNumber);
    if (state?.customerName) this.customerName.set(state.customerName);

    if (!this.phoneNumber()) {
      this.router.navigate(['/order', id, 'details']);
      return;
    }
    this.startResendTimer();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  // ── OTP box handlers ──────────────────────────────────────────────────────────

  onBoxInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const digit = input.value.replace(/\D/g, '').slice(-1); // only last digit
    input.value = digit;

    const current = this.otp().split('');
    current[index] = digit;
    // trim trailing empties but keep length up to index+1
    this.otp.set(current.join('').slice(0, 6));

    if (digit && index < 5) {
      this.focusBox(index + 1);
    }
    this.error.set('');
  }

  onBoxKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      const current = this.otp().split('');
      if (current[index]) {
        current[index] = '';
        this.otp.set(current.join(''));
        const input = document.getElementById(`otp-${index}`) as HTMLInputElement;
        if (input) input.value = '';
      } else if (index > 0) {
        this.focusBox(index - 1);
        const current2 = this.otp().split('');
        current2[index - 1] = '';
        this.otp.set(current2.join(''));
        const prev = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
        if (prev) prev.value = '';
      }
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? '';
    this.otp.set(pasted);
    pasted.split('').forEach((digit, i) => {
      const input = document.getElementById(`otp-${i}`) as HTMLInputElement;
      if (input) input.value = digit;
    });
    this.focusBox(Math.min(pasted.length, 5));
  }

  private focusBox(index: number) {
    setTimeout(() => {
      (document.getElementById(`otp-${index}`) as HTMLInputElement)?.focus();
    }, 0);
  }

  // ── Timer ─────────────────────────────────────────────────────────────────────

  startResendTimer() {
    this.clearTimer();
    this.canResend.set(false);
    this.resendTimer.set(30);
    this.timerInterval = window.setInterval(() => {
      const t = this.resendTimer();
      if (t <= 1) { this.clearTimer(); this.canResend.set(true); this.resendTimer.set(0); }
      else this.resendTimer.set(t - 1);
    }, 1000);
  }

  clearTimer() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = undefined; }
  }

  resendOtp() {
    if (!this.canResend()) return;
    this.loading.set(true);
    this.orderService.sendOtp(this.phoneNumber()).subscribe({
      next: () => { this.loading.set(false); this.otp.set(''); this.startResendTimer(); [0,1,2,3,4,5].forEach(i => { const el = document.getElementById(`otp-${i}`) as HTMLInputElement; if (el) el.value = ''; }); this.focusBox(0); },
      error: () => { this.error.set('Failed to resend OTP'); this.loading.set(false); },
    });
  }

  // ── Verify ────────────────────────────────────────────────────────────────────

  verifyOtp() {
    const otpValue = this.otp().trim();
    if (otpValue.length !== 6) { this.error.set('Please enter all 6 digits'); return; }

    this.loading.set(true);
    this.error.set('');
    this.orderService.verifyOtp(this.phoneNumber(), otpValue).subscribe({
      next: response => {
        if (response.verified) {
          this.orderService.updateCustomerDetails(this.orderId(), { customerName: this.customerName() }).subscribe({
            next: () => { this.loading.set(false); this.router.navigate(['/order', this.orderId(), 'address']); },
            error: () => { this.error.set('Failed to save details'); this.loading.set(false); },
          });
        } else {
          this.error.set('Invalid OTP. Please try again.');
          this.loading.set(false);
        }
      },
      error: () => { this.error.set('Verification failed. Please try again.'); this.loading.set(false); },
    });
  }

  goBack() {
    this.router.navigate(['/order', this.orderId(), 'details']);
  }
}
