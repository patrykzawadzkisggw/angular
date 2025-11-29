import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, shareReplay } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

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

export interface FilterState {
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'relevance';
  okazja?: boolean;
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
  private searchCache = new Map<string, { products: Product[]; ts: number }>();
  private _namesBuilt = false;
  private productNameCache: { id: number; name: string }[] = [];
  private categoryCache: string[] = [];
  // persisted UI filters
  private _filters: FilterState = {};
  private _filtersSubscribers: Array<(f: FilterState) => void> = [];

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
    const key = String(q ?? '');
    if (!forceReload && this.searchCache.has(key)) {
      return of(this.searchCache.get(key)!.products);
    }

    const params = new HttpParams().set('q', key);
    return this.http
      .get<Product[]>(`${this.baseUrl}/products/search`, { params })
      .pipe(
        tap((res) => this.searchCache.set(key, { products: res, ts: Date.now() })),
        catchError(() => of([]))
      );
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

  buildNameCache(forceReload = false): Observable<void> {
    if (this._namesBuilt && !forceReload) {
      return of(void 0);
    }

    return this.getAll(forceReload).pipe(
      tap((products) => {
        this.productNameCache = (products || [])
          .map((p) => ({ id: p.id, name: p.name || '' }))
          .filter((p) => p.name && p.name.length > 0);

        const cats = new Set<string>();
        (products || []).forEach((p) => {
          if (Array.isArray(p.categories)) {
            p.categories.forEach((c) => cats.add(String(c)));
          } else if ((p as any).category) {
            cats.add(String((p as any).category));
          }
        });

        this.categoryCache = Array.from(cats);
        this._namesBuilt = true;
      }),
      map(() => void 0),
      catchError(() => of(void 0))
    );
  }

  suggest(q: string): Observable<Array<{ type: 'product' | 'category'; name: string; id?: number }>> {
    const key = String(q ?? '').trim().toLowerCase();
    if (!key) return of([]);

    return this.buildNameCache().pipe(
      map(() => {
        const products = (this.productNameCache || []).filter((p) => p.name.toLowerCase().includes(key));
        const categories = (this.categoryCache || []).filter((c) => c.toLowerCase().includes(key));

        const productMatches = products.slice(0, 6).map((p) => ({ type: 'product' as const, name: p.name, id: p.id }));
        const categoryMatches = categories.slice(0, 6).map((c) => ({ type: 'category' as const, name: c }));

        return [...productMatches, ...categoryMatches].slice(0, 8);
      }),
      catchError(() => of([]))
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
      this._namesBuilt = false;
      this.productNameCache = [];
      this.categoryCache = [];
      this._filters = {};
      this._filtersSubscribers.forEach((cb) => cb(this._filters));
    } else {
      this.productCache.delete(id);
    }
  }

  getFilters(): FilterState {
    return { ...this._filters };
  }

  setFilters(f: Partial<FilterState>) {
    this._filters = { ...this._filters, ...f };
    this._filtersSubscribers.forEach((cb) => cb(this.getFilters()));
  }

  subscribeFilters(cb: (f: FilterState) => void) {
    this._filtersSubscribers.push(cb);
    cb(this.getFilters());
    return () => {
      const idx = this._filtersSubscribers.indexOf(cb);
      if (idx !== -1) this._filtersSubscribers.splice(idx, 1);
    };
  }

  applyFilters(products: Product[] | null | undefined): Product[] {
    const list = (products || []).slice();
    const f = this._filters || {};

    let res = list.filter((p) => !!p);

    if (f.okazja) {
      res = res.filter((p) => p.price_before_cents != null && p.price_before_cents !== 0);
    }

    if (typeof f.minPrice === 'number') {
      res = res.filter((p) => (p.price_cents || 0) >= f.minPrice!);
    }

    if (typeof f.maxPrice === 'number') {
      res = res.filter((p) => (p.price_cents || 0) <= f.maxPrice!);
    }

    if (f.sort) {
      if (f.sort === 'price_asc') res.sort((a, b) => (a.price_cents || 0) - (b.price_cents || 0));
      else if (f.sort === 'price_desc') res.sort((a, b) => (b.price_cents || 0) - (a.price_cents || 0));
      else if (f.sort === 'name_asc') res.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      else if (f.sort === 'name_desc') res.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    }

    return res;
  }
}
