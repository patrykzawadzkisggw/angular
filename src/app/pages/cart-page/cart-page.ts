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
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-cart-page',
  imports: [CommonModule, FormsModule, CardModule, TagModule, TableModule, RouterLink, ButtonModule, DialogModule, StepperModule, AddInput, ProgressBarModule, InputOtpModule,ProductLink],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss'
})
export class CartPage {
  cartItems$!: Observable<CartItem[]>;
  amounts$!: Observable<{ subtotal: number; shipping: number; grandTotal: number; progress: number; missing: number }>;
  readonly freeShippingThreshold = 300;
  readonly shippingBelowThreshold = 15;

  constructor(private router: Router, private cart: CartService) {
    this.cartItems$ = this.cart.items$;
    this.amounts$ = this.cartItems$.pipe(
      map(items => {
        const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const missing = Math.max(0, this.freeShippingThreshold - subtotal);
        const progress = Math.min(100, (subtotal / this.freeShippingThreshold) * 100) || 0;
        const shipping = subtotal >= this.freeShippingThreshold ? 0 : this.shippingBelowThreshold;
        const grandTotal = subtotal + shipping;
        return { subtotal, shipping, grandTotal, progress, missing };
      })
    );
  }

  showCouponDialog = false;
  showInvalidCouponDialog = false;
  discountApplied = false;
  couponCode: string = '';

  openCouponDialog() {
    this.showCouponDialog = true;
  }

  cancelCouponDialog() {
    this.showCouponDialog = false;
  }

  confirmCoupon() {
    const trimmed = (this.couponCode ?? '').trim();
    if (trimmed === '1234') {
      this.discountApplied = true;
      this.showCouponDialog = false;
    } else {
      this.discountApplied = false;
      this.showCouponDialog = false;
      this.showInvalidCouponDialog = true;
      this.couponCode = '';
    }
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
