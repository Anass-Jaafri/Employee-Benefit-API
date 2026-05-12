import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, User } from '../../shared/models';

const TOKEN_KEY = 'benefitflow_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);

    private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
    private _currentUser = signal<User | null>(this.decodeToken(localStorage.getItem(TOKEN_KEY)));

    readonly currentUser = this._currentUser.asReadonly();
    readonly isLoggedIn = computed(() => this._token() !== null);

    login(email: string, password: string) {
        return this.http
            .post<ApiResponse<{ access_token: string }>>(`${environment.apiUrl}/auth/login`, { email, password })
            .pipe(
                tap(response => {
                    const token = response.data.access_token;
                    localStorage.setItem(TOKEN_KEY, token);
                    this._token.set(token);
                    this._currentUser.set(this.decodeToken(token));
                })
            );
    }

    register(data: { firstName: string; lastName: string; email: string; password: string }) {
        return this.http.post<ApiResponse<{ message: string; userId: number }>>(
            `${environment.apiUrl}/auth/register`,
            data
        );
    }

    logout() {
        localStorage.removeItem(TOKEN_KEY);
        this._token.set(null);
        this._currentUser.set(null);
    }

    getToken(): string | null {
        return this._token();
    }

    private decodeToken(token: string | null): User | null {
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return { id: payload.sub, email: payload.email, role: payload.role };
        } catch {
            return null;
        }
    }
}