import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrderService } from './order-service';

type TokenResponse = { token: string };

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl = environment.apiUrl;
  private readonly storageKey = 'auth_token';

  constructor(private http: HttpClient, private injector: Injector) {}

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
    try {
      const orderService = this.injector.get(OrderService as any) as OrderService | null;
      orderService?.clearCache();
    } catch {}

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
    return this.http.post<void>(`${this.baseUrl}/logout`, {}).pipe(
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

  clearToken() {
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
