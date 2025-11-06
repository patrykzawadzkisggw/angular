import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth-service';

export interface OrderStatusResponse { message: string, image: string };

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly baseUrl = 'https://securebox.hopto.org:8080/api';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  getOrderStatus(orderId: string): Observable<string> {
    const token = this.auth.getToken();

    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http
      .get<OrderStatusResponse>(`${this.baseUrl}/orders/${orderId}/status`, { headers })
      .pipe(
        map(res => res.message)
      );
  }
}