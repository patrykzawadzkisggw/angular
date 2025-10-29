import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  img?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly storageKey = 'cart_items_v1';

  private readonly itemsSubject = new BehaviorSubject<CartItem[]>(this.loadFromStorage());
  readonly items$: Observable<CartItem[]> = this.itemsSubject.asObservable();

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
    const seed: CartItem[] = [
      { id: 1, name: 'Produkt A', quantity: 2, price: 50, img: 'orange.png' },
      { id: 2, name: 'Produkt B', quantity: 1, price: 100, img: 'orange.png' },
      { id: 3, name: 'Produkt C', quantity: 3, price: 30, img: 'orange.png' },
      { id: 4, name: 'Produkt D', quantity: 2, price: 70, img: 'orange.png' }
    ];
    this.saveToStorage(seed);
    return seed;
  }

  private saveToStorage(items: CartItem[]) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch {}
  }

  private setItems(next: CartItem[]) {
    this.saveToStorage(next);
    this.itemsSubject.next(next);
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
  }

  getTotal(): number {
    return this.getItemsSnapshot().reduce((sum, i) => sum + i.price * i.quantity, 0);
  }
}
