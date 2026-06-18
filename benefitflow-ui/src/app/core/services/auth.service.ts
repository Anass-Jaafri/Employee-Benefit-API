import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, filter, map, take, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, Profile, User } from '../../shared/models';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private _currentUser = signal<User | null>(null);
  private _isRefreshing = false;
  private _refreshSubject = new BehaviorSubject<boolean>(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);

  init(): Observable<void> {
    return this.http
      .get<
        ApiResponse<{ id: number; email: string; role: any }>
      >(`${environment.apiUrl}/auth/profile`, { withCredentials: true })
      .pipe(
        tap((res) =>
          this._currentUser.set({
            id: res.data.id,
            email: res.data.email,
            role: res.data.role,
          }),
        ),
        map(() => undefined),
        catchError(() => {
          this._currentUser.set(null);
          return of(undefined);
        }),
      );
  }

  login(email: string, password: string) {
    return this.http
      .post<
        ApiResponse<{ user: User }>
      >(`${environment.apiUrl}/auth/login`, { email, password }, { withCredentials: true })
      .pipe(tap((res) => this._currentUser.set(res.data.user)));
  }

  register(data: { firstName: string; lastName: string; email: string; password: string }) {
    return this.http.post<ApiResponse<{ message: string; userId: number }>>(
      `${environment.apiUrl}/auth/register`,
      data,
    );
  }

  logout(): Observable<void> {
    return this.http
      .post<
        ApiResponse<{ message: string }>
      >(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => this._currentUser.set(null)),
        map(() => undefined),
        catchError(() => {
          this._currentUser.set(null); // clear locally even if request fails
          return of(undefined);
        }),
      );
  }

  refresh(): Observable<void> {
    if (this._isRefreshing) {
      // Another request already triggered a refresh — wait for it
      return this._refreshSubject.pipe(
        filter((done) => done),
        take(1),
        map(() => undefined),
      );
    }

    this._isRefreshing = true;
    this._refreshSubject.next(false);

    return this.http
      .post<
        ApiResponse<{ user: User }>
      >(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((res) => {
          this._isRefreshing = false;
          this._refreshSubject.next(true);
          this._currentUser.set(res.data.user);
        }),
        map(() => undefined),
        catchError((err) => {
          this._isRefreshing = false;
          this._currentUser.set(null);
          throw err;
        }),
      );
  }

  clearUser(): void {
    this._currentUser.set(null);
  }
  getProfile() {
    return this.http
      .get<ApiResponse<Profile>>(`${environment.apiUrl}/auth/profile`)
      .pipe(map((r) => r.data));
  }

  updateProfile(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    jobTitle?: string;
  }) {
    return this.http
      .patch<ApiResponse<Profile>>(`${environment.apiUrl}/auth/profile`, data)
      .pipe(map((r) => r.data));
  }

  changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.http
      .patch<ApiResponse<{ message: string }>>(`${environment.apiUrl}/auth/password`, data)
      .pipe(map((r) => r.data));
  }
}
