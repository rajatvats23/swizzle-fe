import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'kitchen' | 'receptionist';
  phone?: string;
  isActive?: boolean;
  mfaRequired?: boolean;  // admin-controlled toggle
  mfaEnabled?: boolean;   // true after first successful TOTP setup
}

interface LoginResponse {
  token: string;
  user: StaffUser;
}

export interface MfaChallengeResponse {
  mfaRequired: true;
  mfaSetup: boolean;    // true = first time setup, false = verify existing
  mfaToken: string;
  user: StaffUser;
}

export interface MfaSetupData {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

const TOKEN_KEY = 'swizzle_token';
const USER_KEY = 'swizzle_user';
const MFA_TOKEN_KEY = 'swizzle_mfa_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private api = `${environment.apiUrl}/auth`;

  currentUser = signal<StaffUser | null>(this.loadUser());
  isLoggedIn = computed(() => !!this.currentUser());
  userRole = computed(() => this.currentUser()?.role ?? null);

  private loadUser(): StaffUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      const token = localStorage.getItem(TOKEN_KEY);
      if (raw && token) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getMfaToken(): string | null {
    return localStorage.getItem(MFA_TOKEN_KEY);
  }

  storeMfaToken(token: string): void {
    localStorage.setItem(MFA_TOKEN_KEY, token);
  }

  clearMfaToken(): void {
    localStorage.removeItem(MFA_TOKEN_KEY);
  }

  login(email: string, password: string) {
    return this.http.post<LoginResponse | MfaChallengeResponse>(
      `${this.api}/login`,
      { email, password },
    );
  }

  /** Store the final full token + user after all auth steps complete. */
  completeLogin(token: string, user: StaffUser): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    this.clearMfaToken();
  }

  /** GET /api/auth/mfa/setup — returns QR code data */
  mfaSetup() {
    return this.http.post<MfaSetupData>(`${this.api}/mfa/setup`, {});
  }

  /** POST /api/auth/mfa/confirm-setup — verify first TOTP, enables MFA, returns full JWT */
  mfaConfirmSetup(totpToken: string) {
    return this.http.post<LoginResponse>(`${this.api}/mfa/confirm-setup`, { token: totpToken });
  }

  /** POST /api/auth/mfa/verify — subsequent logins, returns full JWT */
  mfaVerify(totpToken: string) {
    return this.http.post<LoginResponse>(`${this.api}/mfa/verify`, { token: totpToken });
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.clearMfaToken();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getMe() {
    return this.http.get<StaffUser>(`${this.api}/me`);
  }

  // Staff CRUD (admin only)
  getAllStaff() {
    return this.http.get<StaffUser[]>(`${this.api}/staff`);
  }

  registerStaff(data: { name: string; email: string; password: string; role: string; phone?: string }) {
    return this.http.post<StaffUser>(`${this.api}/register`, data);
  }

  updateStaff(id: string, data: Partial<{ name: string; role: string; phone: string; isActive: boolean; password: string; mfaRequired: boolean }>) {
    return this.http.patch<StaffUser>(`${this.api}/staff/${id}`, data);
  }

  deleteStaff(id: string) {
    return this.http.delete(`${this.api}/staff/${id}`);
  }
}
