import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, shareReplay } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface Product {
  id: number;
  name: string;
  price_cents: number;
  price_before_cents?: number | null;
  images: string[];
  categories: string[];
}

export interface ProductDetail extends Product {
  stock?: number;
  details?: string;
  storage?: string;
  ingredients?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly baseUrl = 'https://securebox.hopto.org:8080/api';

  private recommendedCache: { products: Product[]; ts: number } | null = null;
  private recommendedRequest: Observable<Product[]> | null = null;

  private allCache: { products: Product[]; ts: number } | null = null;
  private allRequest: Observable<Product[]> | null = null;

  
  private byIdsCache = new Map<string, { products: Product[]; ts: number }>();
  private productCache = new Map<number, { detail: ProductDetail; ts: number }>();

  constructor(private http: HttpClient) {}

  getRecommended(forceReload = false): Observable<Product[]> {
    if (!forceReload && this.recommendedCache) {
      return of(this.recommendedCache.products);
    }

    if (this.recommendedRequest) {
      return this.recommendedRequest;
    }

    const req = this.http.get<Product[]>(`${this.baseUrl}/products/recommended`).pipe(
      tap((res) => {
        this.recommendedCache = { products: res, ts: Date.now() };
      }),
      shareReplay(1),
      catchError((err) => {
        this.recommendedRequest = null;
        return throwError(() => err);
      })
    );

    this.recommendedRequest = req;
    req.subscribe({ next: () => (this.recommendedRequest = null), error: () => (this.recommendedRequest = null) });
    return req;
  }

  search(q: string, forceReload = false): Observable<Product[]> {
    const params = new HttpParams().set('q', q ?? '');
    return this.http
      .get<Product[]>(`${this.baseUrl}/products/search`, { params })
      .pipe(catchError(() => of([])));
  }

  getByIds(ids: number[], forceReload = false): Observable<Product[]> {
    const key = (ids || []).join(',');
    if (!forceReload && this.byIdsCache.has(key)) {
      return of(this.byIdsCache.get(key)!.products);
    }

    const params = new HttpParams().set('ids', key);
    return this.http
      .get<Product[]>(`${this.baseUrl}/products/by_ids`, { params })
      .pipe(
        tap((res) => this.byIdsCache.set(key, { products: res, ts: Date.now() })),
        catchError(() => of([]))
      );
  }

  getAll(forceReload = false): Observable<Product[]> {
    if (!forceReload && this.allCache) {
      return of(this.allCache.products);
    }

    if (this.allRequest) {
      return this.allRequest;
    }

    const req = this.http.get<Product[]>(`${this.baseUrl}/products`).pipe(
      tap((res) => {
        this.allCache = { products: res, ts: Date.now() };
      }),
      shareReplay(1),
      catchError((err) => {
        this.allRequest = null;
        return throwError(() => err);
      })
    );

    this.allRequest = req;
    req.subscribe({ next: () => (this.allRequest = null), error: () => (this.allRequest = null) });
    return req;
  }


  getProduct(id: number, forceReload = false): Observable<ProductDetail> {
    const cached = this.productCache.get(id);
    if (!forceReload && cached) {
      return of(cached.detail);
    }

    return this.http.get<ProductDetail>(`${this.baseUrl}/products/${id}`).pipe(
      tap((res) => {
        if (res && typeof res.id === 'number') {
          this.productCache.set(id, { detail: res, ts: Date.now() });
          this.propagateProductToCaches(res);
        }
      }),
      catchError((err) => throwError(() => err))
    );
  }

  private propagateProductToCaches(product: ProductDetail | Product) {
    const id = product.id;

    if (this.allCache && Array.isArray(this.allCache.products) && this.allCache.products.length) {
      const idx = this.allCache.products.findIndex((p) => p.id === id);
      if (idx !== -1) {
        const existing = this.allCache.products[idx];
        this.allCache.products[idx] = { ...existing, ...product } as Product;
      }
    }

    if (this.recommendedCache && Array.isArray(this.recommendedCache.products) && this.recommendedCache.products.length) {
      const idx = this.recommendedCache.products.findIndex((p) => p.id === id);
      if (idx !== -1) {
        const existing = this.recommendedCache.products[idx];
        this.recommendedCache.products[idx] = { ...existing, ...product } as Product;
      }
    }

    if (this.byIdsCache && this.byIdsCache.size) {
      for (const [key, val] of Array.from(this.byIdsCache.entries())) {
        if (!val || !Array.isArray(val.products) || val.products.length === 0) continue;
        const idx = val.products.findIndex((p) => p.id === id);
        if (idx !== -1) {
          const existing = val.products[idx];
          val.products[idx] = { ...existing, ...product } as Product;
          this.byIdsCache.set(key, { products: val.products, ts: val.ts });
        }
      }
    }

    const scAny = (this as any).searchCache;
    if (scAny instanceof Map && scAny.size) {
      for (const k of Array.from(scAny.keys())) {
        const entry = scAny.get(k);
        if (!entry || !Array.isArray(entry.products) || entry.products.length === 0) continue;
        const idx = entry.products.findIndex((p: any) => p.id === id);
        if (idx !== -1) {
          const existing = entry.products[idx];
          entry.products[idx] = { ...existing, ...product } as Product;
          scAny.set(k, { products: entry.products, ts: entry.ts });
        }
      }
    }
  }

  clearCache(id?: number) {
    if (id == null) {
      this.recommendedCache = null;
      this.recommendedRequest = null;
      this.allCache = null;
      this.allRequest = null;
      this.byIdsCache.clear();
      this.productCache.clear();
    } else {
      this.productCache.delete(id);
    }
  }
}
