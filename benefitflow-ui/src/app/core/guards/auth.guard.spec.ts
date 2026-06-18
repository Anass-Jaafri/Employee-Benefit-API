import { provideRouter, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TestBed } from '@angular/core/testing';
import { authGuard } from './auth.guard';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('authGuard', () => {
  let authService: AuthService;
  let router: Router;

  const runGuard = () => TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), AuthService],
    });

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });
  it('returns true when user is logged in', () => {
    jest.spyOn(authService, 'isLoggedIn').mockReturnValue(true as any);
    expect(runGuard()).toBe(true);
  });

  it('redirects to /auth/login when user is not logged in', () => {
    jest.spyOn(authService, 'isLoggedIn').mockReturnValue(false as any);
    const result = runGuard();
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/auth/login');
  });

  it('returns a UrlTree (not false) so the router handles the redirect cleanly', () => {
    jest.spyOn(authService, 'isLoggedIn').mockReturnValue(false as any);
    const result = runGuard();
    expect(result).not.toBe(false);
    expect(result instanceof UrlTree).toBe(true);
  });
});
