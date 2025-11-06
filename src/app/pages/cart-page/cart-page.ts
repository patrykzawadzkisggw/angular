import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { Router, RouterLink } from "@angular/router";
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { StepperModule } from 'primeng/stepper';
import { AddInput } from '../../componets/add-input/add-input';
import { ProgressBarModule } from 'primeng/progressbar';
import { InputOtpModule } from 'primeng/inputotp';
import { ProductLink } from '../../componets/product-link/product-link';
import { CartService, CartItem } from '../../services/cart-service';
import { map, Observable, combineLatest } from 'rxjs';

@Component({
  selector: 'app-cart-page',
  imports: [CommonModule, FormsModule, CardModule, TagModule, TableModule, RouterLink, ButtonModule, DialogModule, StepperModule, AddInput, ProgressBarModule, InputOtpModule,ProductLink],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss'
})
export class CartPage {
  cartItems$!: Observable<CartItem[]>;
  amounts$!: Observable<{ subtotal: number; shipping: number; grandTotal: number; progress: number; missing: number; discountPct?: number; discountAmount?: number }>;
  readonly freeShippingThreshold = 300;
  readonly shippingBelowThreshold = 15;
  hasInvalid$!: Observable<boolean>;
  showNotFoundDialog = false;
  showInsufficientDialog = false;
  insufficientDetails: Array<{ product_id: number; available: number; missing: number }> = [];

  productNameById = new Map<number, string>();

  constructor(private router: Router, public cart: CartService) {
    this.cartItems$ = this.cart.items$;
    this.amounts$ = combineLatest([this.cartItems$, this.cart.discount$]).pipe(
      map(([items, discount]) => {
        const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const missing = Math.max(0, this.freeShippingThreshold - subtotal);
        const progress = Math.min(100, Math.floor((subtotal / this.freeShippingThreshold) * 100)) || 0;
        const shipping = subtotal >= this.freeShippingThreshold ? 0 : this.shippingBelowThreshold;
        const before = subtotal + shipping;
        const pct = discount?.percentage ?? 0;
        const discountAmount = pct > 0 ? Math.round((before * pct) / 100) : 0;
        const grandTotal = before - discountAmount;
        return { subtotal, shipping, grandTotal, progress, missing, discountPct: pct, discountAmount };
      })
    );
    this.hasInvalid$ = this.cart.invalidIds$.pipe(map(set => set.size > 0));
    this.cartItems$.subscribe(items => {
      this.productNameById.clear();
      for (const it of items) {
        this.productNameById.set(it.id, it.name);
      }
    });

    this.cart.discount$.subscribe(d => {
      this.discountApplied = !!(d && (d.percentage ?? 0) > 0);
      this.couponCode = d?.code ?? '';
    });
  }

  showCouponDialog = false;
  showInvalidCouponDialog = false;
  discountApplied = false;
  couponCode: string = '';

  ngOnInit() {
    const st = history.state as any;
    if (st?.dialog === 'notFound') {
      this.showNotFoundDialog = true;
    } else if (st?.dialog === 'insufficient') {
      this.showInsufficientDialog = true;
      this.insufficientDetails = Array.isArray(st.details) ? st.details : [];
    }
  }

  isInvalid(id: number): boolean {
    return this.cart.isInvalid(id);
  }

  getProductName(id: number): string {
    return this.productNameById.get(id) ?? `ID ${id}`;
  }

  openCouponDialog() {
    if (this.discountApplied) {
      return;
    }
    this.showCouponDialog = true;
  }

  removeCoupon() {
    this.cart.clearDiscount();
    this.discountApplied = false;
    this.couponCode = '';
  }

  cancelCouponDialog() {
    this.showCouponDialog = false;
  }

  confirmCoupon() {
    const trimmed = (this.couponCode ?? '').trim();
    if (!trimmed) return;
    if (trimmed.length > 10) {
      this.showInvalidCouponDialog = true;
      this.couponCode = '';
      return;
    }
    this.cart.applyDiscountCode(trimmed).subscribe({
      next: (res) => {
        if (res.valid) {
          this.discountApplied = true;
          this.showCouponDialog = false;
        } else {
          this.discountApplied = false;
          this.showCouponDialog = false;
          this.showInvalidCouponDialog = true;
          this.couponCode = '';
        }
      },
      error: () => {
        this.discountApplied = false;
        this.showCouponDialog = false;
        this.showInvalidCouponDialog = true;
        this.couponCode = '';
      }
    });
  }

  onStepChange(value: number | undefined) {
    if (value === 1) {
      this.router.navigateByUrl('/cart');
    } else if (value === 2) {
      this.router.navigateByUrl('/delivery');
    }
  }

  onQuantityChange(productId: number, qty: number) {
    this.cart.updateQuantity(productId, qty);
  }

  onRemove(productId: number) {
    this.cart.removeItem(productId);
  }
}
