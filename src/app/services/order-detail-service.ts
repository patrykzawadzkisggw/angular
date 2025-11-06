import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth-service';

export interface OrderItem {
  product_id: number;
  name: string;
  quantity: number;
  price_cents: number;
}

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
  private cache = new Map<number, { order: OrderDetail; ts: number }>();

  constructor(private http: HttpClient, private auth: AuthService) {}


  getOrder(orderId: number, forceReload = false): Observable<OrderDetail> {
    const cached = this.cache.get(orderId);
    if (!forceReload && cached) {
      return of(cached.order);
    }

    const token = this.auth.getToken?.();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http
      .get<OrderDetail>(`https://securebox.hopto.org:8080/api/orders/${orderId}`, { headers })
      .pipe(
        tap(order => {
          if (order && order.id) this.cache.set(orderId, { order, ts: Date.now() });
        })
      );
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
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post<any>(`https://securebox.hopto.org:8080/api/orders/${orderId}/cancel`, {}, { headers }).pipe(
      tap(() => this.clearCache(orderId))
    );
  }
}
