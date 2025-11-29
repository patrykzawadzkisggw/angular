import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Observable,
  map,
  BehaviorSubject,
  of,
  shareReplay,
  tap,
  catchError,
  throwError,
} from 'rxjs';
import { AuthService } from './auth-service';

export interface OrderStatusResponse {
  message: string;
  image: string;
}

export interface Order {
  id: number;
  status: 'Dostarczone' | 'Anulowane' | 'W drodze';
  created_at: string;
  total_cents: number;
  total_items: number;
  images: string[];
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly baseUrl = 'https://securebox.hopto.org:8080/api';

  private ordersCache: Order[] | null = null;
  private orderDetailsCache = new Map<number, any>();
  private ordersSubject = new BehaviorSubject<Order[] | null>(null);
  public orders$ = this.ordersSubject.asObservable();

  private pendingRequest: Observable<Order[]> | null = null;

  constructor(private http: HttpClient, private auth: AuthService) {}

  hasCache(): boolean {
    return !!this.ordersCache && this.ordersCache.length > 0;
  }

  getOrders(forceReload = false): Observable<Order[]> {
    if (!forceReload && this.ordersCache) {
      return of(this.ordersCache);
    }

    if (this.pendingRequest) {
      return this.pendingRequest;
    }

    const req = this.http.get<Order[]>(`${this.baseUrl}/orders`).pipe(
      tap((res) => {
        this.ordersCache = res;
        this.ordersSubject.next(res);
      }),
      shareReplay(1),
      catchError((err) => {
        this.pendingRequest = null;
        return throwError(() => err);
      })
    );

    this.pendingRequest = req;

    req.subscribe({
      next: () => {
        this.pendingRequest = null;
      },
      error: () => {
        this.pendingRequest = null;
      },
    });

    return req;
  }

  refreshOrders(): Observable<Order[]> {
    return this.getOrders(true);
  }

  notifyOrdersChanged(): void {
    this.refreshOrders().subscribe({
      next: () => {
        this.orderDetailsCache.clear();
      },
      error: () => {
        this.orderDetailsCache.clear();
      },
    });
  }

  getOrderStatus(orderId: string): Observable<string> {
    return this.http
      .get<OrderStatusResponse>(`${this.baseUrl}/orders/${orderId}/status`)
      .pipe(map((res) => res.message));
  }

  getOrder(orderId: number, _forceReload = false): Observable<any> {
    if (!_forceReload && this.orderDetailsCache.has(orderId)) {
      return of(this.orderDetailsCache.get(orderId));
    }

    return this.http.get<any>(`${this.baseUrl}/orders/${orderId}`).pipe(
      tap((res) => {
        try {
          this.orderDetailsCache.set(Number(orderId), res);
        } catch {}
      }),
      catchError((err) => throwError(() => err))
    );
  }
}
