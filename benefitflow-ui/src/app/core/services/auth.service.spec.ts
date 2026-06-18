import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { User } from '../../shared/models';

const BASE = `${environment.apiUrl}/auth`;

const mockUser: User = { id: 1, email: 'john@acme.com', role: 'employee' };

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── init() ──────────────────────────────────────────────────────────────────
  describe('init()', () => {
    it('sets currentUser from profile response on success', () => {
      service.init().subscribe();

      httpMock.expectOne(`${BASE}/profile`).flush({
        success: true,
        data: { id: 1, email: 'john@acme.com', role: 'employee' },
      });

      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isLoggedIn()).toBe(true);
    });

    it('sets currentUser to null when profile request fails', () => {
      service.init().subscribe();

      httpMock
        .expectOne(`${BASE}/profile`)
        .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(service.currentUser()).toBeNull();
      expect(service.isLoggedIn()).toBe(false);
    });

    it('completes without error even when the request fails', (done) => {
      service.init().subscribe({ error: () => fail('should not error'), complete: () => done() });

      httpMock.expectOne(`${BASE}/profile`).flush({}, { status: 500, statusText: 'Server Error' });
    });
  });

  // ── login() ─────────────────────────────────────────────────────────────────
  describe('login()', () => {
    it('sets currentUser on successful login', () => {
      service.login('john@acme.com', 'Password123').subscribe();

      httpMock.expectOne(`${BASE}/login`).flush({ success: true, data: { user: mockUser } });

      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isLoggedIn()).toBe(true);
    });

    it('sends credentials to /auth/login with withCredentials', () => {
      service.login('john@acme.com', 'Password123').subscribe();

      const req = httpMock.expectOne(`${BASE}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.body).toEqual({ email: 'john@acme.com', password: 'Password123' });
      req.flush({ success: true, data: { user: mockUser } });
    });

    it('does not change currentUser on login failure', () => {
      service.login('bad@acme.com', 'wrong').subscribe({ error: () => {} });

      httpMock
        .expectOne(`${BASE}/login`)
        .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(service.currentUser()).toBeNull();
    });
  });

  // ── logout() ────────────────────────────────────────────────────────────────
  describe('logout()', () => {
    beforeEach(() => {
      // Pre-set a logged-in user
      service.login('john@acme.com', 'Password123').subscribe();
      httpMock.expectOne(`${BASE}/login`).flush({ success: true, data: { user: mockUser } });
    });

    it('clears currentUser on successful logout', () => {
      expect(service.isLoggedIn()).toBe(true);

      service.logout().subscribe();
      httpMock
        .expectOne(`${BASE}/logout`)
        .flush({ success: true, data: { message: 'Logged out' } });

      expect(service.currentUser()).toBeNull();
      expect(service.isLoggedIn()).toBe(false);
    });

    it('clears currentUser even when logout request fails', () => {
      service.logout().subscribe();
      httpMock.expectOne(`${BASE}/logout`).flush({}, { status: 500, statusText: 'Server Error' });

      expect(service.currentUser()).toBeNull();
    });

    it('sends POST to /auth/logout with withCredentials', () => {
      service.logout().subscribe();
      const req = httpMock.expectOne(`${BASE}/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ success: true, data: { message: 'Logged out' } });
    });
  });

  // ── register() ──────────────────────────────────────────────────────────────
  describe('register()', () => {
    const payload = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@acme.com',
      password: 'Password123',
    };

    it('sends POST to /auth/register with payload', () => {
      let result: any;
      service.register(payload).subscribe((r) => (result = r));

      const req = httpMock.expectOne(`${BASE}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ success: true, data: { message: 'User registered successfully', userId: 5 } });

      expect(result.data.message).toBe('User registered successfully');
      expect(result.data.userId).toBe(5);
    });

    it('does not set currentUser after register', () => {
      service.register(payload).subscribe();
      httpMock
        .expectOne(`${BASE}/register`)
        .flush({ success: true, data: { message: 'OK', userId: 5 } });

      expect(service.currentUser()).toBeNull();
    });
  });

  // ── clearUser() ──────────────────────────────────────────────────────────────
  describe('clearUser()', () => {
    it('sets currentUser to null', () => {
      service.login('john@acme.com', 'Password123').subscribe();
      httpMock.expectOne(`${BASE}/login`).flush({ success: true, data: { user: mockUser } });
      expect(service.isLoggedIn()).toBe(true);

      service.clearUser();
      expect(service.currentUser()).toBeNull();
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  // ── isLoggedIn (computed signal) ─────────────────────────────────────────────
  describe('isLoggedIn', () => {
    it('is false initially', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('becomes true after successful login', () => {
      service.login('john@acme.com', 'Password123').subscribe();
      httpMock.expectOne(`${BASE}/login`).flush({ success: true, data: { user: mockUser } });
      expect(service.isLoggedIn()).toBe(true);
    });

    it('becomes false after clearUser', () => {
      service.login('john@acme.com', 'Password123').subscribe();
      httpMock.expectOne(`${BASE}/login`).flush({ success: true, data: { user: mockUser } });

      service.clearUser();
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  // ── refresh() ────────────────────────────────────────────────────────────────
  describe('refresh()', () => {
    it('updates currentUser on successful refresh', () => {
      const refreshedUser: User = { id: 1, email: 'john@acme.com', role: 'hr_manager' };
      service.refresh().subscribe();

      httpMock.expectOne(`${BASE}/refresh`).flush({ success: true, data: { user: refreshedUser } });

      expect(service.currentUser()).toEqual(refreshedUser);
    });

    it('clears currentUser when refresh fails', () => {
      service.login('john@acme.com', 'Password123').subscribe();
      httpMock.expectOne(`${BASE}/login`).flush({ success: true, data: { user: mockUser } });

      service.refresh().subscribe({ error: () => {} });
      httpMock
        .expectOne(`${BASE}/refresh`)
        .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(service.currentUser()).toBeNull();
    });

    it('sends POST to /auth/refresh with withCredentials', () => {
      service.refresh().subscribe({ error: () => {} });
      const req = httpMock.expectOne(`${BASE}/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });
  });

  // ── getProfile() ─────────────────────────────────────────────────────────────
  describe('getProfile()', () => {
    it('returns unwrapped profile data', () => {
      const profile = {
        id: 1,
        email: 'john@acme.com',
        role: 'employee',
        firstName: 'John',
        lastName: 'Doe',
        jobTitle: null,
        status: 'active',
        company: null,
      };
      let result: any;
      service.getProfile().subscribe((r) => (result = r));

      httpMock.expectOne(`${BASE}/profile`).flush({ success: true, data: profile });
      expect(result).toEqual(profile);
    });
  });

  // ── updateProfile() ───────────────────────────────────────────────────────────
  describe('updateProfile()', () => {
    it('sends PATCH to /auth/profile and returns updated profile', () => {
      const update = { firstName: 'Johnny', jobTitle: 'Lead' };
      let result: any;
      service.updateProfile(update).subscribe((r) => (result = r));

      const req = httpMock.expectOne(`${BASE}/profile`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(update);
      req.flush({ success: true, data: { ...update, id: 1, email: 'john@acme.com' } });

      expect(result.firstName).toBe('Johnny');
    });
  });

  // ── changePassword() ─────────────────────────────────────────────────────────
  describe('changePassword()', () => {
    it('sends PATCH to /auth/password', () => {
      const payload = { currentPassword: 'Old123', newPassword: 'New456' };
      let result: any;
      service.changePassword(payload).subscribe((r) => (result = r));

      const req = httpMock.expectOne(`${BASE}/password`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush({ success: true, data: { message: 'Password updated successfully' } });

      expect(result.message).toBe('Password updated successfully');
    });
  });
});
