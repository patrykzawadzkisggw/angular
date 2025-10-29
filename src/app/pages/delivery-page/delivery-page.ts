import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { Router, RouterLink } from "@angular/router";
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { StepperModule } from 'primeng/stepper';
import { ProgressBarModule } from 'primeng/progressbar';
import { InputOtpModule } from 'primeng/inputotp';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';
import { CartService, CartItem } from '../../services/cart-service';
import { Observable, Subject, map, takeUntil } from 'rxjs';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
@Component({
  selector: 'app-delivery-page',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CardModule, TagModule, TableModule, RouterLink, ButtonModule, DialogModule, StepperModule, ProgressBarModule, InputOtpModule, InputTextModule, IftaLabelModule],
  templateUrl: './delivery-page.html',
  styleUrl: './delivery-page.scss'
})
export class DeliveryPage {
  constructor(private router: Router, private cart: CartService, private fb: FormBuilder) {}

  readonly freeShippingThreshold = 300;
  readonly shippingBelowThreshold = 15;
  amounts$!: Observable<{ subtotal: number; shipping: number; grandTotal: number }>;
  form!: FormGroup;
  showCartEmptyError = false;
  showErrors = false; 
  private destroyed$ = new Subject<void>();
  private isPlacingOrder = false;
  ngOnInit() {
    this.form = this.fb.group({
      
      firstname: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^(?!.*\d).+$/)]],
      lastname: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^(?!.*\d).+$/)]],
      postcode: ['', [Validators.required, Validators.pattern(/^[0-9]{2}-[0-9]{3}$/)]],
      city: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^(?!.*\d).+$/)]],
      
      adres: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/.*\d.*/)]],
    });

    this.amounts$ = this.cart.items$.pipe(
      map(items => {
        const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const shipping = subtotal >= this.freeShippingThreshold ? 0 : this.shippingBelowThreshold;
        const grandTotal = subtotal + shipping;
        return { subtotal, shipping, grandTotal };
      })
    );


    this.cart.items$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(items => {
        if (!this.isPlacingOrder && items.length === 0) {
          this.router.navigateByUrl('/');
        }
      });
  }

  placeOrder() {
    this.showErrors = true;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const items = this.cart.getItemsSnapshot();
    if (!items.length) {
      this.showCartEmptyError = true;
      return;
    }
    this.showCartEmptyError = false;

    this.isPlacingOrder = true;
    this.cart.clear();
    this.showErrors = false;
    this.router.navigateByUrl('/status');
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  onStepChange(value: number | undefined) {
    if (value === 1) {
      this.router.navigateByUrl('/cart');
    } else if (value === 2) {
      // Stay or ensure we are on delivery
      this.router.navigateByUrl('/delivery');
    }
  }
}
