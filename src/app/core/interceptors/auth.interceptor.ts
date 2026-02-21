import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isLoginEndpoint = req.url.includes('/auth/login');
  const isMfaEndpoint = req.url.includes('/auth/mfa/');
  const isCustomerEndpoint =
    req.url.includes('/api/menu') ||
    req.url.includes('/api/orders') ||
    req.url.includes('/api/otp') ||
    req.url.includes('/api/promo/active') ||
    req.url.includes('/api/promo/validate') ||
    req.url.includes('/api/promo/redeem') ||
    req.url.includes('/api/feedback');

  if (isMfaEndpoint) {
    // MFA setup/verify endpoints use the short-lived MFA challenge token
    const mfaToken = auth.getMfaToken();
    if (mfaToken) {
      req = req.clone({ setHeaders: { Authorization: `Bearer ${mfaToken}` } });
    }
  } else if (!isLoginEndpoint && !isCustomerEndpoint) {
    const token = auth.getToken();
    if (token) {
      req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
  }

  return next(req).pipe(
    catchError(err => {
      // Only auto-logout on 401 from protected non-MFA endpoints
      if (err.status === 401 && !isLoginEndpoint && !isMfaEndpoint) {
        auth.logout();
      }
      return throwError(() => err);
    })
  );
};
