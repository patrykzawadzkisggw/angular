import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { ProductService } from '../../services/product-service';
import { ProductList } from '../../componets/product-list/product-list';
import { FilterDrawer } from '../../componets/filter-drawer/filter-drawer';
import { ButtonModule } from 'primeng/button';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import {  finalize, filter } from 'rxjs/operators';

@Component({
  selector: 'app-search-page',
  imports: [CommonModule, ProductList, FilterDrawer, ButtonModule],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss'
})
export class SearchPage implements OnInit, OnDestroy {
  categories$!: Observable<{ name: string; products: any[] }[]>;
  private _categoriesSubject = new BehaviorSubject<{ name: string; products: any[] }[] | null>(null);
  loading$ = new BehaviorSubject<boolean>(false);
  private _loadingCount = 0;
  private _subs = new Subscription();

  private startLoading() {
    this._loadingCount++;
    if (this._loadingCount > 0) {
      Promise.resolve().then(() => this.loading$.next(true));
    }
  }

  private stopLoading() {
    this._loadingCount--;
    if (this._loadingCount <= 0) {
      this._loadingCount = 0;
      Promise.resolve().then(() => this.loading$.next(false));
    }
  }

  filterVisible = false;

  constructor(private route: ActivatedRoute, private productService: ProductService, private router: Router) {
  }

  ngOnInit(): void {
    this.categories$ = this._categoriesSubject.asObservable() as Observable<{ name: string; products: any[] }[]>;

    const navSub = this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
      this.performSearchFromRoute();
    });
    this._subs.add(navSub);

    const unsub = this.productService.subscribeFilters(() => this.performSearchFromRoute());
    this._subs.add({ unsubscribe: unsub } as Subscription);
  }

  private performSearchFromRoute() {
    const q = this.route.snapshot.queryParamMap.get('q') || '';
    const category = this.route.snapshot.queryParamMap.get('category') || '';

    const state = (window && (window.history && (window.history.state || {}))) || {};
    const force = !!(state && (state as any).force);

    if (force) {
      try {
        const newState = Object.assign({}, state);
        delete (newState as any).force;
        history.replaceState(newState, document.title, window.location.href);
      } catch (e) {
      }
    }

    this.startLoading();
    const source$ = q ? this.productService.search(q, force) : this.productService.getAll(force);

    const s = source$
      .pipe(finalize(() => this.stopLoading()))
      .subscribe((products: any[]) => {
        let list = products || [];
        if (category) {
          const catLower = String(category).toLowerCase();
          list = list.filter((p: any) => {
            if (!p) return false;
            if (Array.isArray(p.categories) && p.categories.length) {
              return p.categories.some((c: any) => String(c).toLowerCase() === catLower);
            }
            if ((p as any).category) {
              return String((p as any).category).toLowerCase() === catLower;
            }
            return false;
          });
        }

        const filtered = this.productService.applyFilters(list as any[]);
        const groups = new Map<string, any[]>();
        const isCategoryFiltered = !!category;
        const displayCategoryName = String(category || '');
        (filtered || []).forEach((p) => {
          let cat = 'Inne';
          if (p) {
            if (isCategoryFiltered) {
              cat = displayCategoryName || 'Inne';
            } else {
              if (Array.isArray(p.categories) && p.categories.length) {
                cat = String(p.categories[0]);
              } else if ((p as any).category) {
                cat = String((p as any).category);
              }
            }
          }
          if (!groups.has(cat)) groups.set(cat, []);
          groups.get(cat)!.push(p);
        });
        this._categoriesSubject.next(Array.from(groups.entries()).map(([name, products]) => ({ name, products })));
      });

    this._subs.add(s);
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

}
