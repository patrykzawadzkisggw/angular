import { Component, Input, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
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
export class ProductList implements OnDestroy {
  @Input() categories$?: Observable<{ name: string; products: any[] }[]>;
  @Input() flat$?: Observable<any[]>;
  @Input() loading$?: Observable<boolean>;

  categories: { name: string; products: any[] }[] = [];
  private _flatProducts: any[] = [];
  filteredProducts$ = new BehaviorSubject<any[]>([]);
  tagsList: string[] = [];
  selectedTags: string[] = ['Wszystkie'];
  isMobile = false;
  private readonly TAGS_STORAGE_KEY = 'product-list-selected-tags';
  private _subs = new Subscription();
  private _dataSub = new Subscription();
  private _resizeHandler: any = null;

  constructor() {
    this.loadPersistedSelection();
    this.initMobileListener();
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
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

  private loadPersistedSelection() {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return;
      const raw = window.sessionStorage.getItem(this.TAGS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        this.selectedTags = parsed.map((v) => String(v));
      }
    } catch {
    }
  }

  private persistSelection() {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return;
      const val = this.selectedTags && this.selectedTags.length ? this.selectedTags : ['Wszystkie'];
      window.sessionStorage.setItem(this.TAGS_STORAGE_KEY, JSON.stringify(val));
    } catch {
    }
  }


  public bindCategories(obs: Observable<{ name: string; products: any[] }[]>) {
    const s = obs.subscribe((groups) => {
      this.categories = groups || [];
      this._flatProducts = (groups || []).flatMap((g) => (g.products || []));
      this.tagsList = this.categories.map((g) => g.name);
      if (this.isMobile) {
        this.applyFilterToFlat();
      } else {
        this.filteredProducts$.next(this._flatProducts.slice());
      }
    });
    this._dataSub.add(s);
  }

  public bindFlat(obs: Observable<any[]>) {
    const s = obs.subscribe((arr) => {
      this._flatProducts = arr || [];
      if (this.isMobile) {
        this.applyFilterToFlat();
      } else {
        this.filteredProducts$.next(this._flatProducts.slice());
      }
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
      }
    });
    this._dataSub.add(s);
  }

  onFilterChange(selected: string[]) {
    this.selectedTags = selected || ['Wszystkie'];
    this.persistSelection();
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
