import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth-service';

export interface OrderItem {
  product_id: number;
  name: string;
  quantity: number;
  price_cents: number;
}
export interface OrderStatusResponse { message: string, image: string };
export interface OrderDetail {
  id: number;
  status: string;
  created_at: string;
  total_cents: number;
  total_items: number;
  items: OrderItem[];
  first_name?: string;
  last_name?: string;
  city?: string;
  postal_code?: string;
  address?: string;
  promo_code?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderDetailService {
  private readonly baseUrl = 'https://securebox.hopto.org:8080/api';
  private cache = new Map<number, { order: OrderDetail; ts: number }>();

  constructor(private http: HttpClient, private auth: AuthService) {}

  getOrder(orderId: number, forceReload = false): Observable<OrderDetail> {
    const cached = this.cache.get(orderId);
    if (!forceReload && cached) {
      return of(cached.order);
    }

    const token = this.auth.getToken?.();
    return this.http
      .get<OrderDetail>(`${this.baseUrl}/orders/${orderId}`)
      .pipe(
        tap((order) => {
          if (order && order.id) this.cache.set(orderId, { order, ts: Date.now() });
        })
      );
  }
  getOrderStatus(orderId: string): Observable<string> {
    const token = this.auth.getToken();

    return this.http
      .get<OrderStatusResponse>(`${this.baseUrl}/orders/${orderId}/status`)
      .pipe(map((res) => res.message));
  }

  clearCache(orderId?: number) {
    if (orderId == null) {
      this.cache.clear();
    } else {
      this.cache.delete(orderId);
    }
  }

  cancelOrder(orderId: number) {
    const token = this.auth.getToken?.();
    return this.http
      .post<any>(`${this.baseUrl}/orders/${orderId}/cancel`, {})
      .pipe(tap(() => this.clearCache(orderId)));
  }
}
