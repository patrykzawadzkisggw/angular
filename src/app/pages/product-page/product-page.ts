import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';
import { GalleriaModule } from 'primeng/galleria';
import { DialogModule } from 'primeng/dialog';
import { ProductService, ProductDetail } from '../../services/product-service';
import { CartService } from '../../services/cart-service';
import { AddInput } from '../../componets/add-input/add-input';
import { Observable, of } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { ProductLink } from '../../componets/product-link/product-link';

@Component({
  selector: 'app-product-page',
  imports: [CommonModule, CardModule, ButtonModule, AccordionModule, GalleriaModule, DialogModule, ProductLink, AddInput],
  templateUrl: './product-page.html',
  styleUrl: './product-page.scss'
})
export class ProductPage {
  product$!: Observable<ProductDetail | null>;
  recommended$!: Observable<any[]>;
  images: Array<{ itemImageSrc: string; thumbnailImageSrc: string }> = [];
  responsiveOptions: any[] = [];
  currentProduct: ProductDetail | null = null;
  showAddDialog = false;
  addQuantity = 1;
  addMax: number | undefined = undefined;
  selectedProduct: ProductDetail | null = null;
  showUnavailableDialog = false;
  showAddedDialog = false;

  constructor(private route: ActivatedRoute, private productService: ProductService, private cart: CartService) {
    this.responsiveOptions = [
      { breakpoint: '1024px', numVisible: 5 },
      { breakpoint: '768px', numVisible: 3 },
      { breakpoint: '560px', numVisible: 1 }
    ];

    this.product$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id')) || 0;
        if (!id) return of(null);
        return this.productService.getProduct(id).pipe(catchError(() => of(null)));
      }),
      tap((p) => {
        this.currentProduct = p ?? null;
        this.images = Array.isArray(p?.images)
          ? p!.images.map((img) => ({ itemImageSrc: img, thumbnailImageSrc: img }))
          : [];
      })
    );
    this.recommended$ = this.productService.getRecommended().pipe(
      catchError(() => of([]))
    );
  }

  openAddDialog(p?: ProductDetail | null) {
    const prod = p ?? this.currentProduct;
    if (!prod) return;
    const stock = typeof prod.stock === 'number' ? Math.max(0, Math.floor(prod.stock)) : undefined;
    let alreadyInCart = 0;
    try {
      const snapshot = this.cart.getItemsSnapshot();
      const existing = snapshot.find(i => i.id === prod.id);
      alreadyInCart = existing ? Math.max(0, Math.floor(existing.quantity || 0)) : 0;
    } catch {}

    if (stock !== undefined) {
      const remaining = Math.max(0, stock - alreadyInCart);
      if (remaining <= 0) {
        this.showUnavailableDialog = true;
        return;
      }
      this.addMax = remaining;
    } else {
      this.addMax = undefined;
    }

    this.selectedProduct = prod;
    this.addQuantity = 1;
    this.showAddDialog = true;
  }

  confirmAddToCart() {
    const prod = this.selectedProduct ?? this.currentProduct;
    if (!prod) return;
    const qty = Math.max(0, Math.floor(this.addQuantity || 0));
    if (qty <= 0) return;
    if (this.addMax !== undefined && qty > this.addMax) {
      // safety check
      this.addQuantity = this.addMax;
      return;
    }
    const price = typeof prod.price_cents === 'number' ? prod.price_cents / 100 : 0;
    const item: any = { id: prod.id, name: prod.name, price, quantity: qty, img: Array.isArray(prod.images) && prod.images.length ? prod.images[0] : undefined };
    if (typeof prod.price_before_cents === 'number') {
      item.price_before_cents = prod.price_before_cents;
      item.price_before = prod.price_before_cents / 100;
    }
    this.cart.addItem(item);
    this.showAddDialog = false;
    this.selectedProduct = null;
    this.showAddedDialog = true;
  }

  cancelAddDialog() {
    this.showAddDialog = false;
    this.selectedProduct = null;
    this.addQuantity = 1;
    this.addMax = undefined;
  }

  addToCart(p?: ProductDetail | null) {
    const prod = p ?? this.currentProduct;
    if (!prod) return;
    const price = typeof prod.price_cents === 'number' ? prod.price_cents / 100 : 0;
    try {
      const item: any = { id: prod.id, name: prod.name, price, quantity: 1, img: Array.isArray(prod.images) && prod.images.length ? prod.images[0] : undefined };
      if (typeof prod.price_before_cents === 'number') {
        item.price_before_cents = prod.price_before_cents;
        item.price_before = prod.price_before_cents / 100;
      }
      this.cart.addItem(item);
    } catch {}
  }
}
