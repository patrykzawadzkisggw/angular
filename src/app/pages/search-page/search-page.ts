import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { ProductService } from '../../services/product-service';
import { ProductLink } from '../../componets/product-link/product-link';
import { NotFoundPage } from '../not-found-page/not-found-page';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { map, distinctUntilChanged, finalize, filter } from 'rxjs/operators';

@Component({
  selector: 'app-search-page',
  imports: [CommonModule, ProductLink, NotFoundPage],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss'
})
export class SearchPage implements OnDestroy {
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

  constructor(private route: ActivatedRoute, private productService: ProductService, private router: Router) {
    this.categories$ = this._categoriesSubject.asObservable() as Observable<{ name: string; products: any[] }[]>;

    const navSub = this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
      const q = this.route.snapshot.queryParamMap.get('q') || '';

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
      const s = this.productService
        .search(q, force)
        .pipe(finalize(() => this.stopLoading()))
        .subscribe((products: any[]) => {
          const groups = new Map<string, any[]>();
          (products || []).forEach((p) => {
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
          this._categoriesSubject.next(Array.from(groups.entries()).map(([name, products]) => ({ name, products })));
        });

      this._subs.add(s);
    });

    this._subs.add(navSub);
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

}
