import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    private snackBar = inject(MatSnackBar);
    private router = inject(Router);
    private zone = inject(NgZone);

    handleError(error: unknown): void {

        console.error('[GlobalErrorHandler]', error);


        this.zone.run(() => {
            if (error instanceof HttpErrorResponse) {
                this.handleHttpError(error);
            } else {
                this.handleClientError(error);
            }
        });
    }

    // ── HTTP errors ─────────────────────────────────────────────────────────────
    private handleHttpError(error: HttpErrorResponse): void {
        // 0 = no connection / CORS / server down
        if (error.status === 0) {
            this.show('Unable to reach the server. Check your connection.', 'error');
            return;
        }

        switch (error.status) {
            case 400:

                this.show(error.error?.message ?? 'Invalid request.', 'warning');
                break;

            case 401:
                // Auth interceptor handles token refresh — if we still get here,
                // the refresh also failed. Clear session and redirect to login.
                this.show('Your session has expired. Please log in again.', 'warning');
                this.router.navigate(['/auth/login']);
                break;

            case 403:
                this.show('You do not have permission to perform this action.', 'warning');
                break;

            case 404:
                this.show('The requested resource was not found.', 'warning');
                break;

            case 409:

                this.show(error.error?.message ?? 'A conflict occurred.', 'warning');
                break;

            case 429:
                this.show('Too many requests — please slow down and try again shortly.', 'warning');
                break;

            case 500:
            case 502:
            case 503:
                this.show('A server error occurred. Please try again later.', 'error');
                break;

            default:
                this.show('Something went wrong. Please try again.', 'error');
        }
    }

    // ── Client-side errors ───────────────────────────────────────────────────────
    private handleClientError(error: unknown): void {
        const message = error instanceof Error ? error.message : String(error);


        if (message.includes('ChunkLoadError') || message.includes('Loading chunk')) return;


        if (message.includes('ExpressionChangedAfterItHasBeenChecked')) return;

        this.show('An unexpected error occurred. Please refresh the page.', 'error');
    }

    // ── Helper ───────────────────────────────────────────────────────────────────
    private show(message: string, type: 'error' | 'warning'): void {
        this.snackBar.open(message, 'Dismiss', {
            duration: type === 'error' ? 6000 : 4000,
            panelClass: type === 'error' ? 'snack-error' : 'snack-warning',
        });
    }
}