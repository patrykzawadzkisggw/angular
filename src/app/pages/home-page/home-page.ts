import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProductService } from '../../services/product-service';
import { ProductList } from '../../componets/product-list/product-list';
import { BehaviorSubject, Subscription, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { GalleriaModule } from 'primeng/galleria';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, CardModule, ButtonModule, DialogModule, InputTextModule, ProductList, GalleriaModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss'
})
export class HomePage implements OnDestroy {
  categories$!: Observable<{ name: string; products: any[] }[]>;
  private _categories = new BehaviorSubject<{ name: string; products: any[] }[] | null>(null);
  loading$ = new BehaviorSubject<boolean>(false);
  private _subs = new Subscription();

   images = ['1.jpg', '2.jpg', '3.jpg'];
  responsiveOptions: any[] = [
    { breakpoint: '1024px', numVisible: 5 },
    { breakpoint: '768px', numVisible: 3 },
    { breakpoint: '560px', numVisible: 1 }
  ];

  constructor(private productService: ProductService) {
    this.categories$ = this._categories.asObservable() as Observable<{ name: string; products: any[] }[]>;
    this.loadAll();
  }

  private startLoading() {
    Promise.resolve().then(() => this.loading$.next(true));
  }

  private stopLoading() {
    Promise.resolve().then(() => this.loading$.next(false));
  }

  private loadAll() {
    this.startLoading();
    const s = this.productService.getAll().pipe(finalize(() => this.stopLoading())).subscribe((products: any[]) => {
      const groups = new Map<string, any[]>();
      (products || []).forEach((p: any) => {
        let cat = 'Inne';
        if (p) {
          if (Array.isArray(p.categories) && p.categories.length) {
            cat = String(p.categories[0]);
          } else if (p.category) {
            cat = String(p.category);
          }
        }
        if (!groups.has(cat)) groups.set(cat, []);
        groups.get(cat)!.push(p);
      });
      const grouped = Array.from(groups.entries()).map(([name, products]) => ({ name, products }));
      this._categories.next(grouped);
    });

    this._subs.add(s);
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
  }
}
