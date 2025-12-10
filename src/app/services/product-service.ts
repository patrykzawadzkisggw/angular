import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, shareReplay } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Product {
  id: number;
  name: string;
  price_cents: number;
  stock?: number;
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
  inStock?: boolean;
  outOfStock?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly baseUrl = environment.apiUrl;

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
  private _filters: FilterState = {};
  private _filtersSubscribers: Array<(f: FilterState) => void> = [];

  constructor(private http: HttpClient) {}

  private cloneProducts(arr: Product[] | null | undefined): Product[] {
    return (arr || []).map((p) => ({
      ...p,
      categories: Array.isArray(p.categories) ? [...p.categories] : [],
      images: Array.isArray(p.images) ? [...p.images] : [],
    }));
  }

  private mergePreservingArrays<T extends Product | ProductDetail>(existing: T, incoming: Partial<T>): T {
    const merged: any = { ...existing, ...incoming };

    const existingCats = Array.isArray((existing as any)?.categories) ? (existing as any).categories : [];
    const incomingCats = Array.isArray((incoming as any)?.categories) ? (incoming as any).categories : [];
    if (existingCats.length > 0) {
      merged.categories = [...existingCats];
    } else if (incomingCats.length > 0) {
      merged.categories = [...incomingCats];
    } else {
      merged.categories = [];
    }

    const existingImgs = Array.isArray((existing as any)?.images) ? (existing as any).images : [];
    const incomingImgs = Array.isArray((incoming as any)?.images) ? (incoming as any).images : [];
    if (existingImgs.length > 0) {
      merged.images = [...existingImgs];
    } else if (incomingImgs.length > 0) {
      merged.images = [...incomingImgs];
    } else {
      merged.images = [];
    }

    if ((existing as any)?.category !== undefined) {
      merged.category = (existing as any).category;
    } else if ((incoming as any)?.category !== undefined) {
      merged.category = (incoming as any).category;
    }

    return merged as T;
  }

  private normalizeProductRaw<T extends any>(p: T): T {
    if (!p || typeof p !== 'object') return p;
    const copy: any = { ...p };
    if (copy.hasOwnProperty('stock')) {
      const s = copy.stock;
      if (typeof s === 'number' && Number.isFinite(s)) {
        copy.stock = Math.max(0, Math.floor(s));
      } else {
        delete copy.stock;
      }
    }
    return copy as T;
  }

  private normalizeArray(arr: any[] | undefined | null) {
    if (!Array.isArray(arr)) return [] as any[];
    return arr.map((p) => this.normalizeProductRaw(p));
  }

  getRecommended(forceReload = false): Observable<Product[]> {
    if (!forceReload && this.recommendedCache) {
      return of(this.cloneProducts(this.recommendedCache.products));
    }

    if (this.recommendedRequest) {
      return this.recommendedRequest;
    }

    const req = this.http.get<Product[]>(`${this.baseUrl}/products/recommended`).pipe(
      map((res) => this.normalizeArray(res || [])),
      tap((normalized) => {
        this.recommendedCache = { products: normalized, ts: Date.now() };
      }),
      map((normalized) => this.cloneProducts(normalized)),
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
      return of(this.cloneProducts(this.searchCache.get(key)!.products));
    }

    const params = new HttpParams().set('q', key);
    return this.http
      .get<Product[]>(`${this.baseUrl}/products/search`, { params })
      .pipe(
        map((res) => this.normalizeArray(res)),
        tap((normalized) => this.searchCache.set(key, { products: normalized, ts: Date.now() })),
        map((normalized) => this.cloneProducts(normalized)),
        catchError(() => of([]))
      );
  }

  getByIds(ids: number[], forceReload = false): Observable<Product[]> {
    const key = (ids || []).join(',');
    if (!forceReload && this.byIdsCache.has(key)) {
      return of(this.cloneProducts(this.byIdsCache.get(key)!.products));
    }

    const params = new HttpParams().set('ids', key);
    return this.http
      .get<Product[]>(`${this.baseUrl}/products/by_ids`, { params })
      .pipe(
        map((res) => this.normalizeArray(res)),
        tap((normalized) => this.byIdsCache.set(key, { products: normalized, ts: Date.now() })),
        map((normalized) => this.cloneProducts(normalized)),
        catchError(() => of([]))
      );
  }

  getAll(forceReload = false): Observable<Product[]> {
    if (!forceReload && this.allCache) {
      return of(this.cloneProducts(this.allCache.products));
    }

    if (this.allRequest) {
      return this.allRequest;
    }

    const req = this.http.get<Product[]>(`${this.baseUrl}/products`).pipe(
      map((res) => this.normalizeArray(res || [])),
      tap((normalized) => {
        this.allCache = { products: normalized, ts: Date.now() };
      }),
      map((normalized) => this.cloneProducts(normalized)),
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
      const d = cached.detail;
      return of({
        ...d,
        categories: Array.isArray(d.categories) ? [...d.categories] : [],
        images: Array.isArray(d.images) ? [...d.images] : [],
      });
    }

    return this.http.get<ProductDetail>(`${this.baseUrl}/products/${id}`).pipe(
      map((res) => this.normalizeProductRaw(res)),
      tap((normalized) => {
        if (normalized && typeof (normalized as any).id === 'number') {
          this.productCache.set(id, { detail: normalized, ts: Date.now() });
          this.propagateProductToCaches(normalized);
        }
      }),
      map((normalized) => ({
        ...normalized,
        categories: Array.isArray(normalized?.categories) ? [...(normalized as any).categories] : [],
        images: Array.isArray(normalized?.images) ? [...(normalized as any).images] : [],
      } as ProductDetail)),
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

    const updateList = (arr: Product[] | undefined | null): Product[] | null => {
      if (!Array.isArray(arr) || !arr.length) return null;
      const idx = arr.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      const next = [...arr];
      next[idx] = this.mergePreservingArrays(arr[idx] as Product, product as Product);
      return next;
    };

    const updatedAll = updateList(this.allCache?.products);
    if (updatedAll && this.allCache) {
      this.allCache = { products: updatedAll, ts: this.allCache.ts };
    }

    const updatedRec = updateList(this.recommendedCache?.products);
    if (updatedRec && this.recommendedCache) {
      this.recommendedCache = { products: updatedRec, ts: this.recommendedCache.ts };
    }

    if (this.byIdsCache && this.byIdsCache.size) {
      for (const [key, val] of Array.from(this.byIdsCache.entries())) {
        const updated = updateList(val?.products);
        if (updated) {
          this.byIdsCache.set(key, { products: updated, ts: val!.ts });
        }
      }
    }

    const scAny = (this as any).searchCache;
    if (scAny instanceof Map && scAny.size) {
      for (const k of Array.from(scAny.keys())) {
        const entry = scAny.get(k);
        const updated = updateList(entry?.products);
        if (updated) {
          scAny.set(k, { products: updated, ts: entry!.ts });
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
    const list = this.cloneProducts(products);
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

    const wantIn = !!f.inStock;
    const wantOut = !!f.outOfStock;
    if (wantIn !== wantOut) {
      if (wantIn) {
        res = res.filter((p) => {
          if (p == null) return false;
          if (typeof (p as any).stock === 'number') return (p as any).stock > 0;
          return true;
        });
      } else {
        res = res.filter((p) => {
          if (p == null) return false;
          return typeof (p as any).stock === 'number' ? (p as any).stock === 0 : false;
        });
      }
    }

    return res;
  }

  deductStockForOrder(items: Array<{ product_id: number; quantity: number }>) {
    if (!Array.isArray(items) || items.length === 0) return;

    const byId = new Map<number, number>();
    for (const it of items) {
      const id = Number(it?.product_id);
      const qty = Math.max(0, Math.floor(Number(it?.quantity) || 0));
      if (!Number.isFinite(id) || id <= 0 || qty <= 0) continue;
      byId.set(id, (byId.get(id) || 0) + qty);
    }
    if (!byId.size) return;

    const dec = (p: any, total: number) => {
      if (!p) return p;
      const cur = typeof p.stock === 'number' ? p.stock : undefined;
      if (typeof cur === 'number') {
        const next = Math.max(0, cur - total);
        p.stock = next;
      }
      return p;
    };

    for (const [id, tot] of byId.entries()) {
      const cached = this.productCache.get(id);
      if (cached && cached.detail) {
        cached.detail = dec({ ...cached.detail }, tot);
        this.productCache.set(id, { detail: cached.detail, ts: Date.now() });
      }
    }

    if (this.allCache && Array.isArray(this.allCache.products)) {
      const arr = this.allCache.products.map((p) => {
        const tot = byId.get(p.id);
        return tot ? dec({ ...p }, tot) : p;
      });
      this.allCache = { products: arr as Product[], ts: Date.now() };
    }

    if (this.recommendedCache && Array.isArray(this.recommendedCache.products)) {
      const arr = this.recommendedCache.products.map((p) => {
        const tot = byId.get(p.id);
        return tot ? dec({ ...p }, tot) : p;
      });
      this.recommendedCache = { products: arr as Product[], ts: Date.now() };
    }

    if (this.byIdsCache && this.byIdsCache.size) {
      for (const [key, val] of Array.from(this.byIdsCache.entries())) {
        if (!val || !Array.isArray(val.products)) continue;
        const updated = val.products.map((p) => {
          const tot = byId.get(p.id);
          return tot ? dec({ ...p }, tot) : p;
        });
        this.byIdsCache.set(key, { products: updated as Product[], ts: Date.now() });
      }
    }

    if (this.searchCache && this.searchCache.size) {
      for (const k of Array.from(this.searchCache.keys())) {
        const entry = this.searchCache.get(k);
        if (!entry || !Array.isArray(entry.products)) continue;
        const updated = entry.products.map((p: any) => {
          const tot = byId.get(p.id);
          return tot ? dec({ ...p }, tot) : p;
        });
        this.searchCache.set(k, { products: updated as Product[], ts: Date.now() });
      }
    }
  }
}
