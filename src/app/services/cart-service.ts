import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth-service';
import { Product } from './product-service';
export interface CreateOrderItemRequest {
  product_id: number;
  quantity: number;
}

export interface CreateOrderRequest {
  first_name: string;
  last_name: string;
  city: string;
  postal_code: string;
  address: string;
  promo_code?: string;
  items: CreateOrderItemRequest[];
}

export interface CreateOrderItemResponse {
  product_id: number;
  name: string;
  quantity: number;
  price_cents: number;
}

export interface CreateOrderResponse {
  id: number;
  status: string;
  created_at: string;
  total_cents: number;
  total_items: number;
  items: CreateOrderItemResponse[];
  first_name: string;
  last_name: string;
  city: string;
  postal_code: string;
  address: string;
  promo_code?: string;
}

export interface InvalidOrderErrorBody {
  error: 'invalid_order';
  contactFormErrors?: { [k: string]: string };
  fieldErrors?: { [k: string]: string };
  products_not_found?: number[];
  insufficient_stock?: Array<{ product_id: number; available: number; missing: number }>;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  img?: string;
  price_before?: number;
  price_before_cents?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly storageKey = 'cart_items_v1';
  private readonly invalidKey = 'cart_invalid_ids_v1';
  private readonly deliveryKey = 'cart_delivery_v1';

  private readonly itemsSubject = new BehaviorSubject<CartItem[]>(this.loadFromStorage());
  readonly items$: Observable<CartItem[]> = this.itemsSubject.asObservable();

  private readonly invalidIdsSubject = new BehaviorSubject<Set<number>>(this.loadInvalidFromStorage());
  readonly invalidIds$: Observable<Set<number>> = this.invalidIdsSubject.asObservable();
  private readonly deliverySubject = new BehaviorSubject<Record<string, any> | null>(this.loadDeliveryFromStorage());
  readonly delivery$ = this.deliverySubject.asObservable();
  private readonly discountKey = 'cart_discount_v1';
  private readonly discountSubject = new BehaviorSubject<{ code: string; percentage: number } | null>(this.loadDiscountFromStorage());
  readonly discount$ = this.discountSubject.asObservable();

  // backend api base
  private readonly baseUrl = 'https://securebox.hopto.org:8080/api';

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          return parsed
            .filter((i) => typeof i?.id === 'number' && typeof i?.price === 'number')
            .map((i) => ({ ...i, quantity: Math.max(0, Math.floor(i.quantity || 0)) }))
            .filter((i) => i.quantity > 0);
        }
      }
    } catch {}
    const seed: CartItem[] = [];
    this.saveToStorage(seed);
    return seed;
  }

  constructor(private http: HttpClient, private auth: AuthService) {}

  createOrder(payload: CreateOrderRequest): Observable<CreateOrderResponse> {
    const token = this.auth.getToken();
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<CreateOrderResponse>(`${this.baseUrl}/orders`, payload, { headers });
  }

  private saveToStorage(items: CartItem[]) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch {}
  }

  private saveInvalidToStorage(ids: Set<number>) {
    try {
      localStorage.setItem(this.invalidKey, JSON.stringify(Array.from(ids)));
    } catch {}
  }

  private setItems(next: CartItem[]) {
    this.saveToStorage(next);
    this.itemsSubject.next(next);
    this.cleanupInvalidFlags(next);
  }

  getItemsSnapshot(): CartItem[] {
    return this.itemsSubject.getValue();
  }

  addItem(item: CartItem) {
    const items = this.getItemsSnapshot();
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      const updated = [...items];
      updated[idx] = {
        ...updated[idx],
        quantity: Math.max(0, (updated[idx].quantity || 0) + (item.quantity || 1))
      };
      this.setItems(updated.filter((i) => i.quantity > 0));
    } else {
      this.setItems([...items, { ...item, quantity: Math.max(1, item.quantity || 1) }]);
    }
  }

  updateQuantity(id: number, quantity: number) {
    const qty = Math.max(0, Math.floor(quantity));
    const items = this.getItemsSnapshot().map((i) => (i.id === id ? { ...i, quantity: qty } : i));
    this.setItems(items.filter((i) => i.quantity > 0));
  }

  removeItem(id: number) {
    const items = this.getItemsSnapshot().filter((i) => i.id !== id);
    this.setItems(items);
  }

  clear() {
    this.setItems([]);
    this.clearInvalidProductFlags();
    this.clearDeliveryInfo();
  }

  getTotal(): number {
    return this.getItemsSnapshot().reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  setInvalidProductIds(ids: number[]) {
    const set = new Set<number>(ids);
    this.invalidIdsSubject.next(set);
    this.saveInvalidToStorage(set);
  }

  clearInvalidProductFlags() {
    const empty = new Set<number>();
    this.invalidIdsSubject.next(empty);
    this.saveInvalidToStorage(empty);
  }

  isInvalid(id: number): boolean {
    return this.invalidIdsSubject.getValue().has(id);
  }

  private cleanupInvalidFlags(items: CartItem[]) {
    const current = new Set(this.invalidIdsSubject.getValue());
    const validIds = new Set(items.map(i => i.id));
    let changed = false;
    for (const id of Array.from(current)) {
      if (!validIds.has(id)) {
        current.delete(id);
        changed = true;
      }
    }
    if (changed) {
      this.invalidIdsSubject.next(current);
      this.saveInvalidToStorage(current);
    }
  }

  private loadInvalidFromStorage(): Set<number> {
    try {
      const raw = localStorage.getItem(this.invalidKey);
      if (!raw) return new Set();
      const arr = JSON.parse(raw) as number[];
      if (Array.isArray(arr)) return new Set(arr.filter(n => typeof n === 'number'));
    } catch {}
    return new Set();
  }

  private loadDeliveryFromStorage(): Record<string, any> | null {
    try {
      const raw = localStorage.getItem(this.deliveryKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Record<string, any>;
      return parsed;
    } catch {
      return null;
    }
  }

  private saveDeliveryToStorage(payload: Record<string, any> | null) {
    try {
      if (payload === null) {
        localStorage.removeItem(this.deliveryKey);
      } else {
        localStorage.setItem(this.deliveryKey, JSON.stringify(payload));
      }
    } catch {}
  }

  private loadDiscountFromStorage(): { code: string; percentage: number } | null {
    try {
      const raw = localStorage.getItem(this.discountKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { code: string; percentage: number };
      if (parsed && typeof parsed.code === 'string' && typeof parsed.percentage === 'number') return parsed;
    } catch {}
    return null;
  }

  private saveDiscountToStorage(payload: { code: string; percentage: number } | null) {
    try {
      if (payload === null) {
        localStorage.removeItem(this.discountKey);
      } else {
        localStorage.setItem(this.discountKey, JSON.stringify(payload));
      }
    } catch {}
  }

  checkDiscount(code: string) {
    const url = `${this.baseUrl}/discounts/check`;
    return this.http.post<{ valid: boolean; percentage?: number }>(url, { code });
  }

  applyDiscountCode(code: string) {
    return new Observable<{ valid: boolean; percentage?: number }>(subscriber => {
      this.checkDiscount(code).subscribe({
        next: (res) => {
          if (res.valid && typeof res.percentage === 'number' && res.percentage > 0) {
            const payload = { code, percentage: Math.max(0, Math.floor(res.percentage)) };
            this.discountSubject.next(payload);
            this.saveDiscountToStorage(payload);
            subscriber.next(res);
            subscriber.complete();
          } else {
            this.clearDiscount();
            subscriber.next(res);
            subscriber.complete();
          }
        },
        error: (err) => subscriber.error(err)
      });
    });
  }

  clearDiscount() {
    this.discountSubject.next(null);
    this.saveDiscountToStorage(null);
  }

  setDeliveryInfo(data: { first_name?: string; last_name?: string; postal_code?: string; city?: string; address?: string; promo_code?: string } | null) {
    const normalized = data ? { ...data } : null;
    this.deliverySubject.next(normalized);
    this.saveDeliveryToStorage(normalized);
  }

  getDeliveryInfo(): Record<string, any> | null {
    return this.deliverySubject.getValue();
  }

  clearDeliveryInfo() {
    this.deliverySubject.next(null);
    this.saveDeliveryToStorage(null);
  }

  applyStockAdjustments(adjustments: Array<{ product_id: number; available: number }>) {
    const mapAvail = new Map(adjustments.map(a => [a.product_id, Math.max(0, Math.floor(a.available))]));
    const items = this.getItemsSnapshot();
    const updated: CartItem[] = [];
    for (const it of items) {
      if (mapAvail.has(it.id)) {
        const avail = mapAvail.get(it.id)!;
        if (avail > 0) {
          updated.push({ ...it, quantity: Math.min(it.quantity, avail) });
        }
      } else {
        updated.push(it);
      }
    }
    this.setItems(updated);
  }

  updateProductsMetadata(products: Product[]) {
    if (!Array.isArray(products) || products.length === 0) return;
    const byId = new Map<number, Product>(products.map(p => [p.id, p]));
    const items = this.getItemsSnapshot();
    const updated = items.map(i => {
      const p = byId.get(i.id);
      if (!p) return i;
      const price = (typeof p.price_cents === 'number') ? (p.price_cents / 100) : i.price;
      const img = Array.isArray(p.images) && p.images.length ? p.images[0] : i.img;
      const price_before_cents = (typeof p.price_before_cents === 'number') ? p.price_before_cents : null;
      const price_before = typeof price_before_cents === 'number' ? (price_before_cents / 100) : undefined;
      return { ...i, name: p.name ?? i.name, price, img, price_before_cents, price_before };
    });
    this.setItems(updated);
  }
}
