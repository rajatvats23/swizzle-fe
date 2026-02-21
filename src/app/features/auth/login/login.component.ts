import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, MfaChallengeResponse } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
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
            Manage your restaurant<br />with confidence.
          </h2>
          <p class="text-white/50 text-sm leading-relaxed max-w-sm">
            Orders, kitchen display, analytics, staff management, and promo codes — all in one dashboard.
          </p>
        </div>

        <div class="flex items-center gap-3 text-white/30 text-xs">
          <span class="material-symbols-outlined text-sm">lock</span>
          <span>Secure authentication with JWT + TOTP 2FA</span>
        </div>
      </div>

      <!-- Right: Login Form -->
      <div class="flex-1 flex items-center justify-center p-6">
        <div class="w-full max-w-md">

          <!-- Mobile brand -->
          <div class="flex items-center gap-3 mb-10 lg:hidden">
            <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span class="material-symbols-outlined text-white text-xl">storefront</span>
            </div>
            <span class="text-xl font-bold tracking-tight">Swizzle</span>
          </div>

          <h2 class="text-2xl font-extrabold text-gray-900 mb-1">Welcome back</h2>
          <p class="text-gray-500 text-sm mb-8">Sign in to access the admin panel</p>

          @if (error()) {
            <div class="flex items-center gap-2 p-3 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <span class="material-symbols-outlined text-lg">error</span>
              {{ error() }}
            </div>
          }

          <form (ngSubmit)="onLogin()" class="space-y-5">
            <!-- Email -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">mail</span>
                <input
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  placeholder="admin&#64;swizzle.com"
                  class="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">lock</span>
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="Enter your password"
                  class="w-full pl-10 pr-12 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <span class="material-symbols-outlined text-xl">
                    {{ showPassword() ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Login Button -->
            <button
              type="submit"
              [disabled]="loading()"
              class="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              @if (loading()) {
                <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Signing in...
              } @else {
                <span class="material-symbols-outlined text-xl">login</span>
                Sign In
              }
            </button>
          </form>

          <div class="mt-8 pt-6 border-t border-gray-100">
            <p class="text-xs text-gray-400 text-center">
              Default credentials: admin&#64;swizzle.com / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  error = signal('');
  loading = signal(false);
  showPassword = signal(false);

  onLogin() {
    if (!this.email || !this.password) {
      this.error.set('Please enter email and password');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.loading.set(false);

        // Admin MFA required
        if ('mfaRequired' in res) {
          const mfaRes = res as MfaChallengeResponse;
          this.auth.storeMfaToken(mfaRes.mfaToken);

          if (mfaRes.mfaSetup) {
            // First-time: redirect to setup page (email link also works, but this is the in-band path)
            this.router.navigate(['/mfa-setup']);
          } else {
            // MFA already enabled: go to verify screen
            this.router.navigate(['/mfa-verify']);
          }
          return;
        }

        // Normal login (non-admin roles)
        this.auth.completeLogin(res.token, res.user);
        const role = res.user.role;
        if (role === 'kitchen') {
          this.router.navigate(['/admin/kitchen']);
        } else if (role === 'receptionist') {
          this.router.navigate(['/receptionist']);
        } else {
          this.router.navigate(['/admin']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Login failed. Please check your credentials.');
      },
    });
  }
}
