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

@Component({
  selector: 'app-cart-page',
  imports: [CommonModule, FormsModule, CardModule, TagModule, TableModule, RouterLink, ButtonModule, DialogModule, StepperModule, AddInput, ProgressBarModule, InputOtpModule,ProductLink],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss'
})
export class CartPage {
  constructor(private router: Router) {}
products = [
    { id: 1, name: 'Produkt A', quantity: 2, price: 50, img: 'orange.png' },
    { id: 2, name: 'Produkt B', quantity: 1, price: 100, img: 'orange.png' },
    { id: 3, name: 'Produkt C', quantity: 3, price: 30, img: 'orange.png' },
    { id: 4, name: 'Produkt D', quantity: 2, price: 70, img: 'orange.png' },
]

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
}
