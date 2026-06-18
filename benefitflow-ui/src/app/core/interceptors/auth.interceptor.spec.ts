import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { of, throwError } from 'rxjs';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        AuthService,
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpMock.verify());

  it('adds withCredentials: true to every outgoing request', () => {
    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('passes through successful responses unchanged', () => {
    let response: any;
    http.get('/api/test').subscribe((r) => (response = r));

    httpMock.expectOne('/api/test').flush({ success: true });
    expect(response).toEqual({ success: true });
  });

  it('attempts token refresh on 401 from a non-auth endpoint', () => {
    const refreshSpy = jest.spyOn(authService, 'refresh').mockReturnValue(of({} as any));

    http.get('/api/employees').subscribe({ error: () => {} });

    // First request — returns 401
    httpMock
      .expectOne('/api/employees')
      .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(refreshSpy).toHaveBeenCalled();

    // Retry request after refresh
    httpMock.expectOne('/api/employees').flush({ items: [] });
  });

  it('does NOT attempt refresh on 401 from /auth/login', () => {
    const refreshSpy = jest.spyOn(authService, 'refresh');

    http.get('/api/auth/login').subscribe({ error: () => {} });

    httpMock
      .expectOne('/api/auth/login')
      .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it('does NOT attempt refresh on 401 from /auth/refresh', () => {
    const refreshSpy = jest.spyOn(authService, 'refresh');

    http.get('/api/auth/refresh').subscribe({ error: () => {} });

    httpMock
      .expectOne('/api/auth/refresh')
      .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it('clears user and navigates to /auth/login when refresh fails', () => {
    const clearSpy = jest.spyOn(authService, 'clearUser').mockImplementation(() => {});
    const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    jest
      .spyOn(authService, 'refresh')
      .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    http.get('/api/employees').subscribe({ error: () => {} });

    httpMock
      .expectOne('/api/employees')
      .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(clearSpy).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith(['/auth/login']);
  });

  it('propagates non-401 errors without attempting refresh', () => {
    const refreshSpy = jest.spyOn(authService, 'refresh');
    let caughtError: any;

    http.get('/api/employees').subscribe({ error: (e) => (caughtError = e) });

    httpMock
      .expectOne('/api/employees')
      .flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });

    expect(refreshSpy).not.toHaveBeenCalled();
    expect(caughtError.status).toBe(404);
  });
});
