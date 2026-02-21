import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, MfaSetupData } from '../../../core/services/auth.service';

type Step = 'loading' | 'scan' | 'confirm' | 'error';

@Component({
  selector: 'app-mfa-setup',
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
            Secure your account<br />with 2FA.
          </h2>
          <p class="text-white/50 text-sm leading-relaxed max-w-sm">
            Admin accounts require two-factor authentication. Scan the QR code once with your authenticator app — you're set for every future login.
          </p>
        </div>

        <div class="flex items-center gap-3 text-white/30 text-xs">
          <span class="material-symbols-outlined text-sm">shield</span>
          <span>TOTP compatible with Google Authenticator & Authy</span>
        </div>
      </div>

      <!-- Right: Setup Form -->
      <div class="flex-1 flex items-center justify-center p-6">
        <div class="w-full max-w-md">

          <!-- Mobile brand -->
          <div class="flex items-center gap-3 mb-10 lg:hidden">
            <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span class="material-symbols-outlined text-white text-xl">storefront</span>
            </div>
            <span class="text-xl font-bold tracking-tight">Swizzle</span>
          </div>

          <!-- Loading -->
          @if (step() === 'loading') {
            <div class="flex flex-col items-center gap-4 py-16">
              <span class="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
              <p class="text-gray-500 text-sm">Generating your authenticator code…</p>
            </div>
          }

          <!-- Error state -->
          @if (step() === 'error') {
            <div class="text-center py-10">
              <span class="material-symbols-outlined text-5xl text-red-400 mb-4 block">error</span>
              <p class="text-gray-700 font-semibold mb-2">Setup failed</p>
              <p class="text-gray-500 text-sm mb-6">{{ errorMsg() }}</p>
              <button
                (click)="goToLogin()"
                class="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          }

          <!-- Step 1: Scan QR -->
          @if (step() === 'scan' && setupData()) {
            <div>
              <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span class="material-symbols-outlined text-primary text-xl">qr_code_2</span>
                </div>
                <div>
                  <h2 class="text-xl font-extrabold text-gray-900">Set up 2FA</h2>
                  <p class="text-gray-500 text-xs">Step 1 of 2 — Scan the QR code</p>
                </div>
              </div>

              <div class="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
                <p class="text-sm text-gray-600 mb-4">
                  Open <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP app and scan this code:
                </p>
                <div class="flex justify-center mb-4">
                  <img
                    [src]="setupData()!.qrDataUrl"
                    alt="TOTP QR Code"
                    class="w-48 h-48 border border-gray-100 rounded-xl p-2"
                  />
                </div>
                <div class="border-t border-gray-100 pt-4">
                  <p class="text-xs text-gray-400 mb-1">Or enter this key manually:</p>
                  <div class="flex items-center gap-2">
                    <code class="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-gray-700 break-all">
                      {{ formatSecret(setupData()!.secret) }}
                    </code>
                    <button
                      type="button"
                      (click)="copySecret()"
                      class="shrink-0 p-2 text-gray-400 hover:text-primary transition-colors cursor-pointer"
                      title="Copy secret"
                    >
                      <span class="material-symbols-outlined text-lg">{{ copied() ? 'check' : 'content_copy' }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <button
                (click)="step.set('confirm')"
                class="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span class="material-symbols-outlined text-xl">arrow_forward</span>
                I've scanned the code
              </button>
            </div>
          }

          <!-- Step 2: Confirm with TOTP code -->
          @if (step() === 'confirm') {
            <div>
              <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span class="material-symbols-outlined text-primary text-xl">pin</span>
                </div>
                <div>
                  <h2 class="text-xl font-extrabold text-gray-900">Verify your code</h2>
                  <p class="text-gray-500 text-xs">Step 2 of 2 — Enter the 6-digit code</p>
                </div>
              </div>

              @if (confirmError()) {
                <div class="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <span class="material-symbols-outlined text-lg">error</span>
                  {{ confirmError() }}
                </div>
              }

              <div class="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
                <p class="text-sm text-gray-600 mb-4">
                  Enter the 6-digit code shown in your authenticator app to complete setup:
                </p>
                <input
                  type="text"
                  [(ngModel)]="totpCode"
                  name="totpCode"
                  placeholder="000000"
                  maxlength="6"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  class="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 px-6 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>

              <div class="flex gap-3">
                <button
                  type="button"
                  (click)="step.set('scan')"
                  class="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  (click)="confirmSetup()"
                  [disabled]="confirming() || totpCode.length !== 6"
                  class="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  @if (confirming()) {
                    <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Verifying…
                  } @else {
                    <span class="material-symbols-outlined text-xl">verified</span>
                    Enable 2FA
                  }
                </button>
              </div>
            </div>
          }

        </div>
      </div>
    </div>
  `,
})
export class MfaSetupComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  step = signal<Step>('loading');
  setupData = signal<MfaSetupData | null>(null);
  errorMsg = signal('');
  confirmError = signal('');
  copied = signal(false);
  confirming = signal(false);
  totpCode = '';

  ngOnInit() {
    if (!this.auth.getMfaToken()) {
      this.errorMsg.set('No authentication session found. Please log in again.');
      this.step.set('error');
      return;
    }

    this.auth.mfaSetup().subscribe({
      next: (data) => {
        this.setupData.set(data);
        this.step.set('scan');
      },
      error: (err) => {
        this.errorMsg.set(err.error?.error || 'Failed to generate setup code. Please log in again.');
        this.step.set('error');
      },
    });
  }

  formatSecret(secret: string): string {
    return secret.match(/.{1,4}/g)?.join(' ') ?? secret;
  }

  copySecret() {
    const secret = this.setupData()?.secret ?? '';
    navigator.clipboard.writeText(secret).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  confirmSetup() {
    if (this.totpCode.length !== 6) return;
    this.confirming.set(true);
    this.confirmError.set('');

    this.auth.mfaConfirmSetup(this.totpCode).subscribe({
      next: (res) => {
        this.confirming.set(false);
        this.auth.completeLogin(res.token, res.user);
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        this.confirming.set(false);
        this.confirmError.set(err.error?.error || 'Invalid code. Please try again.');
        this.totpCode = '';
      },
    });
  }

  goToLogin() {
    this.auth.clearMfaToken();
    this.router.navigate(['/login']);
  }
}
