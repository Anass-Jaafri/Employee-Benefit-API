import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const authReq = req.clone({ withCredentials: true });

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            const isAuthEndpoint =
                req.url.includes('/auth/login') ||
                req.url.includes('/auth/refresh') ||
                req.url.includes('/auth/register');

            if (error.status === 401 && !isAuthEndpoint) {
                return authService.refresh().pipe(
                    switchMap(() => next(authReq)), // retry original request
                    catchError(refreshError => {
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