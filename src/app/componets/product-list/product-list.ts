import { Component, Input, OnDestroy, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductLink } from '../product-link/product-link';
import { FilterTag } from '../filter-tag/filter-tag';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ProductLink, FilterTag],
  templateUrl: './product-list.html',
})
export class ProductList implements OnDestroy, AfterViewInit {
  @Input() categories$?: Observable<{ name: string; products: any[] }[]>;
  @Input() flat$?: Observable<any[]>;
  @Input() loading$?: Observable<boolean>;

  categories: { name: string; products: any[] }[] = [];
  displayedCategories: { name: string; products: any[] }[] = [];
  private renderBatchSize = 3;
  private renderCount = 0;
  private estimatedCategoryHeight = 520;
  private _scrollHandler: any = null;
  private _flatProducts: any[] = [];
  filteredProducts$ = new BehaviorSubject<any[]>([]);
  displayedProducts: any[] = [];
  private productBatchSize = 8;
  private productRenderCount = 0;
  private estimatedProductHeight = 220;
  tagsList: string[] = [];
  selectedTags: string[] = ['Wszystkie'];
  isMobile = false;

  private _subs = new Subscription();
  private _dataSub = new Subscription();
  private _resizeHandler: any = null;

  constructor() {
    this.initMobileListener();
    this._subs.add(this.filteredProducts$.subscribe((arr) => this.resetDisplayedProducts(arr)));
  }

  ngAfterViewInit(): void {
    this.computeInitialRenderCount();
    this.setupScrollListener();
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
    if (this._scrollHandler) window.removeEventListener('scroll', this._scrollHandler);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['categories$'] || changes['flat$']) {
      this._dataSub.unsubscribe();
      this._dataSub = new Subscription();
      if (this.categories$) this.bindCategories(this.categories$);
      if (this.flat$) this.bindFlat(this.flat$);
    }
  }

  private initMobileListener() {
    const check = () => {
      const prev = this.isMobile;
      this.isMobile = window.innerWidth <= 768;
      if (this.isMobile !== prev && this.isMobile) {
        this.applyFilterToFlat();
      }
    };
    check();
    this._resizeHandler = () => check();
    window.addEventListener('resize', this._resizeHandler);
  }


  public bindCategories(obs: Observable<{ name: string; products: any[] }[]>) {
    const s = obs.subscribe((groups) => {
      this.categories = groups || [];
      this._flatProducts = (groups || []).flatMap((g) => (g.products || []));
      this.tagsList = this.categories.map((g) => g.name);
      this.filteredProducts$.next(this._flatProducts.slice());
      this.resetRenderedCategories();
    });
    this._dataSub.add(s);
  }

  public bindFlat(obs: Observable<any[]>) {
    const s = obs.subscribe((arr) => {
      this._flatProducts = arr || [];
      this.filteredProducts$.next(this._flatProducts.slice());
      if (!this.categories || !this.categories.length) {
        const groups = new Map<string, any[]>();
        (this._flatProducts || []).forEach((p) => {
          let cat = 'Inne';
          if (p) {
            if (Array.isArray(p.categories) && p.categories.length) cat = String(p.categories[0]);
            else if (p.category) cat = String(p.category);
          }
          if (!groups.has(cat)) groups.set(cat, []);
          groups.get(cat)!.push(p);
        });
        this.categories = Array.from(groups.entries()).map(([name, products]) => ({ name, products }));
        this.tagsList = this.categories.map((g) => g.name);
        this.resetRenderedCategories();
      }
    });
    this._dataSub.add(s);
  }

  private computeInitialRenderCount() {
    try {
      const approx = Math.max(1, Math.floor((window.innerHeight || 800) / this.estimatedCategoryHeight));
      this.renderCount = Math.max(this.renderBatchSize, approx);
    } catch {
      this.renderCount = this.renderBatchSize;
    }
    this.updateDisplayedCategories();
  }

  private resetRenderedCategories() {
    this.computeInitialRenderCount();
  }

  private updateDisplayedCategories() {
    if (!this.categories || !this.categories.length) {
      this.displayedCategories = [];
      return;
    }
    this.displayedCategories = this.categories.slice(0, Math.min(this.renderCount, this.categories.length));
  }

  private setupScrollListener() {
    this._scrollHandler = () => {
      try {
        const nearBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 400);
        if (nearBottom) {
          if (this.displayedCategories.length < this.categories.length && !this.isMobile) {
            this.renderCount = Math.min(this.categories.length, this.renderCount + this.renderBatchSize);
            this.updateDisplayedCategories();
          }
          if (this.isMobile) {
            const total = (this.filteredProducts$.getValue() || []).length;
            if (this.displayedProducts.length < total) {
              this.productRenderCount = Math.min(total, this.productRenderCount + this.productBatchSize);
              this.updateDisplayedProducts();
            }
          }
        }
      } catch {}
    };
    window.addEventListener('scroll', this._scrollHandler);
  }

  private computeInitialProductCount() {
    try {
      const approx = Math.max(1, Math.floor((window.innerHeight || 800) / this.estimatedProductHeight));
      this.productRenderCount = Math.max(this.productBatchSize, approx);
    } catch {
      this.productRenderCount = this.productBatchSize;
    }
    this.updateDisplayedProducts();
  }

  private resetDisplayedProducts(arr?: any[]) {
    const list = Array.isArray(arr) ? arr : this.filteredProducts$.getValue();
    this.computeInitialProductCount();
    this.displayedProducts = (list || []).slice(0, Math.min(this.productRenderCount, (list || []).length));
  }

  private updateDisplayedProducts() {
    const list = this.filteredProducts$.getValue() || [];
    this.displayedProducts = list.slice(0, Math.min(this.productRenderCount, list.length));
  }

  onFilterChange(selected: string[]) {
    this.selectedTags = selected || ['Wszystkie'];
    if (this.isMobile) this.applyFilterToFlat();
  }

  private applyFilterToFlat() {
    const sel = this.selectedTags || ['Wszystkie'];
    if (!this._flatProducts || !this._flatProducts.length) {
      this.filteredProducts$.next([]);
      return;
    }
    if (sel.length === 0 || sel.includes('Wszystkie')) {
      this.filteredProducts$.next(this._flatProducts.slice());
      return;
    }
    const filtered = this._flatProducts.filter((p) => {
      if (!p) return false;
      const cats: string[] = Array.isArray(p.categories) ? p.categories : p.category ? [String(p.category)] : [];
      return cats.some((c) => sel.includes(String(c)));
    });
    this.filteredProducts$.next(filtered);
  }
}
