import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';

type TokenResponse = { token: string };

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl = 'https://securebox.hopto.org:8080/api';
  private readonly storageKey = 'auth_token';

  constructor(private http: HttpClient) {}

  register(email: string, password: string): Observable<string> {
    const body = { login: email, password };
    return this.http
      .post<TokenResponse>(`${this.baseUrl}/register`, body, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      })
      .pipe(
        map((res) => res.token),
        tap((token) => this.setToken(token))
      );
  }

  login(email: string, password: string): Observable<string> {
    const body = { login: email, password };
    return this.http
      .post<TokenResponse>(`${this.baseUrl}/login`, body, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      })
      .pipe(
        map((res) => res.token),
        tap((token) => this.setToken(token))
      );
  }

  logout(): Observable<void> {
    const token = this.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
    return this.http.post<void>(`${this.baseUrl}/logout`, {}, { headers }).pipe(
      tap({
        next: () => this.clearToken(),
        error: () => this.clearToken(),
      })
    );
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(this.storageKey);
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const exp = this.getJwtExp(token);
    if (!exp) return true;
    const nowSeconds = Math.floor(Date.now() / 1000);
    return exp > nowSeconds;
  }

  private setToken(token: string) {
    try {
      localStorage.setItem(this.storageKey, token);
    } catch {}
  }

  private clearToken() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {}
  }

  private getJwtExp(jwt: string): number | null {
    try {
      const payload = jwt.split('.')[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      const exp = decoded?.exp;
      return typeof exp === 'number' ? exp : null;
    } catch {
      return null;
    }
  }
}
