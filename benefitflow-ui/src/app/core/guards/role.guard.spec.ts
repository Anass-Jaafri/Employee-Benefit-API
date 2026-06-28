import { TestBed } from '@angular/core/testing';
import { GuardResult, provideRouter, Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../services/auth.service';
import { roleGuard } from './role.guard';
import { UserRole } from '../../shared/models/user.model';

function runGuard(allowedRoles: UserRole[], userRole: UserRole | null): GuardResult {
  const mockUser = userRole ? { id: 1, email: 'test@test.com', role: userRole } : null;

  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      {
        provide: AuthService,
        useValue: {
          currentUser: signal(mockUser),
          isLoggedIn: signal(mockUser !== null),
        },
      },
    ],
  });

  return TestBed.runInInjectionContext(() =>
    roleGuard(allowedRoles)({} as any, {} as any),
  ) as GuardResult;
}

describe('roleGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  // ── Returns true (access granted) ──────────────────────────────────────────

  it('grants access when user role is in the allowed list', () => {
    expect(runGuard(['admin', 'hr_manager'], 'hr_manager')).toBe(true);
  });

  it('grants access to admin on admin-only routes', () => {
    expect(runGuard(['admin'], 'admin')).toBe(true);
  });

  it('grants access to hr_manager on hr+admin routes', () => {
    expect(runGuard(['admin', 'hr_manager'], 'hr_manager')).toBe(true);
  });

  // ── Returns UrlTree (access denied → redirect) ──────────────────────────────

  it('redirects employee away from admin-only routes', () => {
    const result = runGuard(['admin'], 'employee');
    expect(result).toBeInstanceOf(UrlTree);
  });

  it('redirects employee away from hr_manager+admin routes', () => {
    const result = runGuard(['admin', 'hr_manager'], 'employee');
    expect(result).toBeInstanceOf(UrlTree);
  });

  it('redirects to /dashboard/home — user is authenticated, not authorised', () => {
    const result = runGuard(['admin'], 'employee');
    const router = TestBed.inject(Router);
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as unknown as UrlTree)).toBe('/dashboard/home');
  });

  it('redirects when no user is logged in', () => {
    const result = runGuard(['admin'], null);
    expect(result).toBeInstanceOf(UrlTree);
  });

  it('returns a UrlTree (not false) so the router handles redirect cleanly', () => {
    const result = runGuard(['admin'], 'employee');
    expect(result).not.toBe(false);
    expect(result).toBeInstanceOf(UrlTree);
  });
});
