import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Read XSRF-TOKEN cookie — set server-side by NestJS csrf middleware
  const xsrfToken = getCookie('XSRF-TOKEN');

  // Only attach CSRF header on state-mutating methods
  const isMutating = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method);

  const authReq = req.clone({
    withCredentials: true,
    ...(xsrfToken && isMutating ? { setHeaders: { 'X-XSRF-TOKEN': xsrfToken } } : {}),
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/register');

      if (error.status === 401 && !isAuthEndpoint) {
        return authService.refresh().pipe(
          switchMap(() => next(authReq)),
          catchError((refreshError) => {
            authService.clearUser();
            router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}
