import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { ApiResponse, AuthTokens, LoginRequest } from '@monorepo/shared';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessToken = signal<string | null>(null);

  readonly isLoggedIn = this.accessToken.asReadonly();

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest) {
    return this.http.post<ApiResponse<AuthTokens>>('/api/auth/login', credentials).pipe(
      tap((res) => this.accessToken.set(res.data.accessToken))
    );
  }

  logout() {
    return this.http.post('/api/auth/logout', {}).pipe(
      tap(() => {
        this.accessToken.set(null);
        this.router.navigate(['/admin/login']);
      })
    );
  }

  refresh() {
    return this.http.post<ApiResponse<AuthTokens>>('/api/auth/refresh', {}).pipe(
      tap((res) => this.accessToken.set(res.data.accessToken))
    );
  }

  getToken(): string | null {
    return this.accessToken();
  }

  getUserEmail(): string | null {
    const token = this.accessToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['email'] ?? null;
    } catch {
      return null;
    }
  }

  clearToken(): void {
    this.accessToken.set(null);
  }
}
