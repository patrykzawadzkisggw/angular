import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProductService } from '../../services/product-service';
import { ProductList } from '../../componets/product-list/product-list';
import { FilterDrawer } from '../../componets/filter-drawer/filter-drawer';
import { SearchTags } from '../../componets/search-tags/search-tags';
import { BehaviorSubject, Subscription, Observable } from 'rxjs';
import { finalize, map, distinctUntilChanged } from 'rxjs/operators';
import { GalleriaModule } from 'primeng/galleria';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

interface SearchTag {
  name: string;
  image: string;
  category?: string;
}

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, CardModule, ButtonModule, DialogModule, InputTextModule, ProductList, FilterDrawer, SearchTags, GalleriaModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss'
})
export class HomePage implements OnInit, OnDestroy {
  filterVisible = false;
  categories$!: Observable<{ name: string; products: any[] }[]>;
  private _categories = new BehaviorSubject<{ name: string; products: any[] }[] | null>(null);
  loading$ = new BehaviorSubject<boolean>(false);
  private _subs = new Subscription();
  private _filtersUnsub?: () => void;
  isMobile = false;
 tags: SearchTag[] = [
  { name: 'Bezglutenowe', image: 'gluten.svg', category: 'Bezglutenowe' },
  { name: 'Herbaty', image: 'drink.svg', category: 'Herbaty' },
  { name: 'Kawy', image: 'drink.svg', category: 'Kawy' },
 { name: 'Mięso', image: 'chicken.svg', category: 'Mięso' },
  { name: 'Mleczarnia', image: 'milk.svg', category: 'Mleczarnia' },
  { name: 'Mrożonki', image: 'prod.svg', category: 'Mrożonki' },
  { name: 'Nabiał', image: 'meat.svg', category: 'Nabiał' },
  { name: 'Napoje', image: 'drink.svg', category: 'Napoje' },
  { name: 'Oleje', image: 'oil.svg', category: 'Oleje' },
  { name: 'Owoce', image: 'fruit.svg', category: 'Owoce' },
  { name: 'Piekarnia', image: 'bread2.svg', category: 'Piekarnia' },
   { name: 'Przekąski', image: 'bread.svg', category: 'Przekąski' },
  { name: 'Przyprawy', image: 'carrot.svg', category: 'Przyprawy' },
  { name: 'Ryby', image: 'fish.svg', category: 'Ryby' },
  { name: 'Sery', image: 'cheese.svg', category: 'Sery' },
  { name: 'Słodycze', image: 'badges.svg', category: 'Słodycze' },
  { name: 'Warzywa', image: 'vegetables.svg', category: 'Warzywa' },
  { name: 'Wędliny', image: 'beef.svg', category: 'Wędliny' },
  { name: 'Zbożowe', image: 'flour.svg', category: 'Zbożowe' }
];


   images = ['1.jpg', '2.jpg', '3.jpg'];
  responsiveOptions: any[] = [
    { breakpoint: '1024px', numVisible: 5 },
    { breakpoint: '768px', numVisible: 3 },
    { breakpoint: '560px', numVisible: 1 }
  ];

  constructor(private productService: ProductService, private breakpointObserver: BreakpointObserver) {
    this.categories$ = this._categories.asObservable() as Observable<{ name: string; products: any[] }[]>;
    this._filtersUnsub = this.productService.subscribeFilters(() => this.loadAll());
    this.loadAll();
  }

  ngOnInit() {
    const bpSub = this.breakpointObserver
      .observe(['(max-width: 767px)'])
      .pipe(map(r => r.matches), distinctUntilChanged())
      .subscribe((matches) => {
        this.isMobile = matches;
      });

    this._subs.add(bpSub);
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
      const filtered = this.productService.applyFilters(products as any[]);
      const groups = new Map<string, any[]>();
      (filtered || []).forEach((p: any) => {
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
    if (this._filtersUnsub) this._filtersUnsub();
  }
}
