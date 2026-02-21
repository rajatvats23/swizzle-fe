import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-mfa-verify',
  standalone: true,
  imports: [FormsModule],
  host: { class: 'flex flex-col min-h-screen' },
  template: `
    <div class="flex flex-1 min-h-screen bg-background-light">

      <!-- Left: Brand Panel -->
      <div class="hidden lg:flex w-[480px] bg-[#0a2e1a] flex-col justify-between p-10">
        <div>
          <div class="flex items-center gap-3 mb-16">
            <div class="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <span class="material-symbols-outlined text-white text-2xl">storefront</span>
            </div>
            <div>
              <h1 class="text-white text-xl font-bold tracking-tight">Swizzle</h1>
              <p class="text-white/40 text-xs">Restaurant Management</p>
            </div>
          </div>

          <h2 class="text-white text-3xl font-extrabold leading-tight mb-4">
            Two-factor<br />authentication.
          </h2>
          <p class="text-white/50 text-sm leading-relaxed max-w-sm">
            Your account is protected with TOTP two-factor authentication. Enter the 6-digit code from your authenticator app to continue.
          </p>
        </div>

        <div class="flex items-center gap-3 text-white/30 text-xs">
          <span class="material-symbols-outlined text-sm">schedule</span>
          <span>Codes refresh every 30 seconds</span>
        </div>
      </div>

      <!-- Right: Verify Form -->
      <div class="flex-1 flex items-center justify-center p-6">
        <div class="w-full max-w-md">

          <!-- Mobile brand -->
          <div class="flex items-center gap-3 mb-10 lg:hidden">
            <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span class="material-symbols-outlined text-white text-xl">storefront</span>
            </div>
            <span class="text-xl font-bold tracking-tight">Swizzle</span>
          </div>

          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span class="material-symbols-outlined text-primary text-xl">security</span>
            </div>
            <div>
              <h2 class="text-xl font-extrabold text-gray-900">Verify your identity</h2>
              <p class="text-gray-500 text-xs">Enter the code from your authenticator app</p>
            </div>
          </div>

          @if (error()) {
            <div class="flex items-center gap-2 p-3 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <span class="material-symbols-outlined text-lg">error</span>
              {{ error() }}
            </div>
          }

          <div class="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <p class="text-sm text-gray-500 mb-4 text-center">
              Open your authenticator app and enter the 6-digit code for <strong>Swizzle</strong>
            </p>
            <input
              type="text"
              [(ngModel)]="totpCode"
              name="totpCode"
              placeholder="000000"
              maxlength="6"
              inputmode="numeric"
              autocomplete="one-time-code"
              (keyup.enter)="onVerify()"
              class="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 px-6 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              autofocus
            />
          </div>

          <button
            type="button"
            (click)="onVerify()"
            [disabled]="loading() || totpCode.length !== 6"
            class="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mb-3"
          >
            @if (loading()) {
              <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Verifying…
            } @else {
              <span class="material-symbols-outlined text-xl">lock_open</span>
              Verify & Sign In
            }
          </button>

          <button
            type="button"
            (click)="goToLogin()"
            class="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors cursor-pointer"
          >
            ← Back to login
          </button>
        </div>
      </div>
    </div>
  `,
})
export class MfaVerifyComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  totpCode = '';
  error = signal('');
  loading = signal(false);

  ngOnInit() {
    if (!this.auth.getMfaToken()) {
      this.router.navigate(['/login']);
    }
  }

  onVerify() {
    if (this.totpCode.length !== 6) return;
    this.loading.set(true);
    this.error.set('');

    this.auth.mfaVerify(this.totpCode).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.auth.completeLogin(res.token, res.user);
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Invalid code. Please try again.');
        this.totpCode = '';
      },
    });
  }

  goToLogin() {
    this.auth.clearMfaToken();
    this.router.navigate(['/login']);
  }
}
