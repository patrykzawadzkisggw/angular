import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';
import { GalleriaModule } from 'primeng/galleria';
import { ProductService, ProductDetail } from '../../services/product-service';
import { CartService } from '../../services/cart-service';
import { Observable, of } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { ProductLink } from '../../componets/product-link/product-link';

@Component({
  selector: 'app-product-page',
  imports: [CommonModule, CardModule, ButtonModule, AccordionModule, GalleriaModule, ProductLink],
  templateUrl: './product-page.html',
  styleUrl: './product-page.scss'
})
export class ProductPage {
  product$!: Observable<ProductDetail | null>;
  recommended$!: Observable<any[]>;
  images: Array<{ itemImageSrc: string; thumbnailImageSrc: string }> = [];
  responsiveOptions: any[] = [];
  currentProduct: ProductDetail | null = null;

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

  addToCart(p?: ProductDetail | null) {
    const prod = p ?? this.currentProduct;
    if (!prod) return;
    const price = typeof prod.price_cents === 'number' ? prod.price_cents / 100 : 0;
    try {
      this.cart.addItem({ id: prod.id, name: prod.name, price, quantity: 1, img: Array.isArray(prod.images) && prod.images.length ? prod.images[0] : undefined });
    } catch {}
  }
}
