import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { GlobalErrorHandler } from './global-error.handler';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('GlobalErrorHandler', () => {
  let handler: GlobalErrorHandler;
  let snackBarOpen: jest.Mock;
  let router: Router;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    snackBarOpen = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        provideRouter([]),
        provideAnimationsAsync(),
        {
          provide: MatSnackBar,
          useValue: { open: snackBarOpen },
        },
      ],
    });

    handler = TestBed.inject(GlobalErrorHandler);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  const makeHttp = (status: number, body: any = {}): HttpErrorResponse =>
    new HttpErrorResponse({ status, error: body, url: '/api/test' });

  // ── HTTP errors ──────────────────────────────────────────────────────────────
  it('shows the backend message for 400 Bad Request', () => {
    handler.handleError(makeHttp(400, { message: 'Validation failed' }));
    expect(snackBarOpen).toHaveBeenCalledWith(
      'Validation failed',
      expect.anything(),
      expect.anything(),
    );
  });

  it('redirects to /auth/login on 401', () => {
    handler.handleError(makeHttp(401));
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('shows session-expired snackbar on 401', () => {
    handler.handleError(makeHttp(401));
    expect(snackBarOpen).toHaveBeenCalledWith(
      expect.stringMatching(/session|expired|log in/i),
      expect.anything(),
      expect.anything(),
    );
  });

  it('shows permission-denied message for 403', () => {
    handler.handleError(makeHttp(403));
    expect(snackBarOpen).toHaveBeenCalledWith(
      expect.stringMatching(/permission/i),
      expect.anything(),
      expect.anything(),
    );
  });

  it('shows not-found message for 404', () => {
    handler.handleError(makeHttp(404));
    expect(snackBarOpen).toHaveBeenCalledWith(
      expect.stringMatching(/not found/i),
      expect.anything(),
      expect.anything(),
    );
  });

  it('shows backend message for 409 Conflict', () => {
    handler.handleError(makeHttp(409, { message: 'Email already exists' }));
    expect(snackBarOpen).toHaveBeenCalledWith(
      'Email already exists',
      expect.anything(),
      expect.anything(),
    );
  });

  it('shows rate-limit message for 429', () => {
    handler.handleError(makeHttp(429));
    expect(snackBarOpen).toHaveBeenCalledWith(
      expect.stringMatching(/too many/i),
      expect.anything(),
      expect.anything(),
    );
  });

  it('shows server-error message for 500', () => {
    handler.handleError(makeHttp(500));
    expect(snackBarOpen).toHaveBeenCalledWith(
      expect.stringMatching(/server error/i),
      expect.anything(),
      expect.anything(),
    );
  });

  it('shows server-error message for 503', () => {
    handler.handleError(makeHttp(503));
    expect(snackBarOpen).toHaveBeenCalledWith(
      expect.stringMatching(/server error/i),
      expect.anything(),
      expect.anything(),
    );
  });

  it('shows connection-error message for status 0', () => {
    handler.handleError(makeHttp(0));
    expect(snackBarOpen).toHaveBeenCalledWith(
      expect.stringMatching(/reach the server/i),
      expect.anything(),
      expect.anything(),
    );
  });

  // ── Client-side errors ───────────────────────────────────────────────────────
  it('silently ignores ChunkLoadError', () => {
    const err = new Error('ChunkLoadError: Loading chunk 5 failed');
    handler.handleError(err);
    expect(snackBarOpen).not.toHaveBeenCalled();
  });

  it('silently ignores ExpressionChangedAfterItHasBeenChecked errors', () => {
    const err = new Error('ExpressionChangedAfterItHasBeenCheckedError');
    handler.handleError(err);
    expect(snackBarOpen).not.toHaveBeenCalled();
  });
});
