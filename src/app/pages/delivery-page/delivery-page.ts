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
import { CartService, CartItem, CreateOrderRequest, InvalidOrderErrorBody  } from '../../services/cart-service';
import { ProductService } from '../../services/product-service';
import { OrderService } from '../../services/order-service';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, map, takeUntil, combineLatest } from 'rxjs';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
@Component({
  selector: 'app-delivery-page',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CardModule, TagModule, TableModule, RouterLink, ButtonModule, DialogModule, StepperModule, ProgressBarModule, InputOtpModule, InputTextModule, IftaLabelModule],
  templateUrl: './delivery-page.html',
  styleUrl: './delivery-page.scss'
})
export class DeliveryPage {
  constructor(private router: Router, private cart: CartService, private fb: FormBuilder, private orderService: OrderService, private productService: ProductService) {}

  readonly freeShippingThreshold = 300;
  readonly shippingBelowThreshold = 15;
  amounts$!: Observable<{ subtotal: number; shipping: number; grandTotal: number; discountPct?: number; discountAmount?: number }>;
  form!: FormGroup;
  showCartEmptyError = false;
  showErrors = false; 
  private destroyed$ = new Subject<void>();
  private isPlacingOrder = false;

  contactFormErrors: { [k: string]: string } | null = null;
  fieldErrors: { [k: string]: string } | null = null;
  productsNotFound: number[] | null = null;
  insufficientStock: Array<{ product_id: number; available: number; missing: number }> | null = null;
  generalError: string | null = null;
  ngOnInit() {
    this.form = this.fb.group({
      
      firstname: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^(?!.*\d).+$/)]],
      lastname: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^(?!.*\d).+$/)]],
      postcode: ['', [Validators.required, Validators.pattern(/^[0-9]{2}-[0-9]{3}$/)]],
      city: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^(?!.*\d).+$/)]],
      
      adres: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/.*\d.*/)]],
    });

    this.amounts$ = combineLatest([this.cart.items$, this.cart.discount$]).pipe(
      map(([items, discount]) => {
        const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const shipping = subtotal >= this.freeShippingThreshold ? 0 : this.shippingBelowThreshold;
        const before = subtotal + shipping;
        const pct = discount?.percentage ?? 0;
        const discountAmount = pct > 0 ? Math.round((before * pct) / 100) : 0;
        const grandTotal = before - discountAmount;
        return { subtotal, shipping, grandTotal, discountPct: pct, discountAmount };
      })
    );


    this.cart.items$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(items => {
        if (!this.isPlacingOrder && items.length === 0) {
          this.router.navigateByUrl('/');
        }
      });

    const saved = this.cart.getDeliveryInfo();
    if (saved) {
      this.form.patchValue({
        firstname: saved['first_name'] ?? saved['firstname'] ?? '',
        lastname: saved['last_name'] ?? saved['lastname'] ?? '',
        postcode: saved['postal_code'] ?? saved['postcode'] ?? '',
        city: saved['city'] ?? '',
        adres: saved['address'] ?? saved['adres'] ?? ''
      });
    }

    this.form.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(vals => {
      const payload = {
        first_name: vals.firstname,
        last_name: vals.lastname,
        postal_code: vals.postcode,
        city: vals.city,
        address: vals.adres
      };
      this.cart.setDeliveryInfo(payload);
    });

    try {
      const alreadyBootstrapped = !!(window as any).__appInitialBootstrapDone;
      if (!alreadyBootstrapped) {
        (window as any).__appInitialBootstrapDone = true;
        const ids = this.cart.getItemsSnapshot().map(i => i.id);
        if (ids.length) {
          this.productService.getByIds(ids, true).subscribe({
            next: (products) => {
              try { this.cart.updateProductsMetadata(products as any); } catch (e) {}
            },
            error: () => {}
          });
        }
      }
    } catch {}
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

    this.contactFormErrors = null;
    this.fieldErrors = null;
    this.productsNotFound = null;
    this.insufficientStock = null;
    this.generalError = null;

    const payload: CreateOrderRequest = {
      first_name: this.form.value.firstname,
      last_name: this.form.value.lastname,
      city: this.form.value.city,
      postal_code: this.form.value.postcode,
      address: this.form.value.adres,
      items: items.map(i => ({ product_id: i.id, quantity: i.quantity }))
    };

    this.isPlacingOrder = true;
    this.cart.createOrder(payload).subscribe({
      next: (order: any) => {
        this.cart.clear();
        this.showErrors = false;
        this.isPlacingOrder = false;
        try { this.orderService.notifyOrdersChanged(); } catch {}
        this.router.navigate(['/orders', order.id, 'status']);
      },
      error: (err: HttpErrorResponse) => {
        this.isPlacingOrder = false;
        if (err.status === 401) {
          this.router.navigate(['/login'], { queryParams: { redirect: '/delivery' } });
          return;
        }
        if (err.status === 400 && err.error) {
          const body = err.error as InvalidOrderErrorBody | { error?: string };
          if ((body as InvalidOrderErrorBody).error === 'invalid_order') {
            const invalid = body as InvalidOrderErrorBody;
            this.contactFormErrors = invalid.contactFormErrors || null;
            this.fieldErrors = invalid.fieldErrors || null;
            this.productsNotFound = invalid.products_not_found || null;
            this.insufficientStock = invalid.insufficient_stock || null;

            if (this.contactFormErrors?.['first_name']) {
              this.form.get('firstname')?.setErrors({ server: this.contactFormErrors['first_name'] });
            }
            if (this.contactFormErrors?.['last_name']) {
              this.form.get('lastname')?.setErrors({ server: this.contactFormErrors['last_name'] });
            }
            if (this.fieldErrors?.['postal_code']) {
              this.form.get('postcode')?.setErrors({ server: this.fieldErrors['postal_code'] });
            }
            if (this.fieldErrors?.['address']) {
              this.form.get('adres')?.setErrors({ server: this.fieldErrors['address'] });
            }
            if (this.fieldErrors?.['city']) {
              this.form.get('city')?.setErrors({ server: this.fieldErrors['city'] });
            }
            if (this.productsNotFound && this.productsNotFound.length) {
              this.cart.setInvalidProductIds(this.productsNotFound);
              this.router.navigate(['/cart'], {
                state: {
                  dialog: 'notFound',
                  ids: this.productsNotFound
                }
              });
            }

            if (this.insufficientStock && this.insufficientStock.length) {
              this.cart.applyStockAdjustments(this.insufficientStock.map(s => ({ product_id: s.product_id, available: s.available })));
              this.router.navigate(['/cart'], {
                state: {
                  dialog: 'insufficient',
                  details: this.insufficientStock
                }
              });
            }

            return;
          }
          if ((body as any).error) {
            this.generalError = (body as any).error;
            return;
          }
        }
        this.generalError = 'server_error';
      }
    });
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  onStepChange(value: number | undefined) {
    if (value === 1) {
      this.router.navigateByUrl('/cart');
    } else if (value === 2) {
      this.router.navigateByUrl('/delivery');
    }
  }
}
