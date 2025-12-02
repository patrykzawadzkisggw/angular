import { Component, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { CartService } from '../../services/cart-service';
import { AuthService } from '../../services/auth-service';
import { ProductService } from '../../services/product-service';
import { map, Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar-component',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    MenuModule,
    BadgeModule,
  ],
  templateUrl: './navbar-component.html',
  styleUrl: './navbar-component.scss',
})
export class NavbarComponent implements OnDestroy {
  query = '';
  mobileMenuOpen = false;
  items: MenuItem[] = [];
  cartCount$!: Observable<number>;
  suggestions: Array<{ type: 'product' | 'category'; name: string; id?: number }> = [];
  searchHasFocus = false;
  selectedSuggestionIndex = -1;
  private _subs = new Subscription();

  @ViewChild('profileMenu') profileMenu!: Menu;

  constructor(private router: Router, private cart: CartService, private auth: AuthService, private productService: ProductService) {}

  ngOnDestroy() {
    this._subs.unsubscribe();
  }

  onQueryChange(val: string) {
    this.query = val;
    this.updateSuggestions();
  }

  onSuggestionsKeydown(e: KeyboardEvent) {
    if (!this.suggestions || this.suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, this.suggestions.length - 1);
      this.searchHasFocus = true;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
    } else if (e.key === 'Enter') {
      if (this.selectedSuggestionIndex >= 0 && this.selectedSuggestionIndex < this.suggestions.length) {
        e.preventDefault();
        const item = this.suggestions[this.selectedSuggestionIndex];
        this.onSuggestionClick(item);
      } else {
      }
    } else if (e.key === 'Escape') {
      this.suggestions = [];
      this.selectedSuggestionIndex = -1;
    }
  }

  onSearchFocus() {
    this.searchHasFocus = true;
    this.updateSuggestions();
  }

  onSearchBlur() {
    setTimeout(() => {
      this.searchHasFocus = false;
      this.suggestions = [];
    }, 200);
  }

  private updateSuggestions() {
    const q = (this.query || '').trim();
    if (!q || !this.searchHasFocus) {
      this.suggestions = [];
      return;
    }

    const s = this.productService.suggest(q).subscribe((res) => (this.suggestions = res));
    this._subs.add(s);
    this.selectedSuggestionIndex = -1;
  }

  onSuggestionClick(item: { type: 'product' | 'category'; name: string; id?: number }) {
    this.query = item.name;
    if (item.type === 'product' && item.id != null) {
      this.router.navigate(['/product', item.id]);
    } else if (item.type === 'category') {
      this.router.navigate(['/search'], { queryParams: { category: item.name }, state: { force: true } });
    }
    this.suggestions = [];
  }

  ngOnInit() {
    this.items = [
      { label: 'Strona główna', icon: 'pi pi-home', command: () => this.navigateHome() },
      { label: 'Zamówienia', icon: 'pi pi-list', command: () => this.router.navigate(['/orders']) },
      { separator: true },
      { label: 'Wyloguj', icon: 'pi pi-sign-out', command: () => this.logout() },
    ];

    this.cartCount$ = this.cart.items$.pipe(
      map((items) => items.reduce((sum, i) => sum + (i.quantity || 0), 0))
    );
  }

  onSearch() {
    const trimmed = this.query.trim();
    if(trimmed === '')  return;
    this.router.navigate(
      ['/search'],
      trimmed ? { queryParams: { q: trimmed }, state: { force: true } } : undefined
    );
  }

  navigateHome() {
    this.router.navigate(['']);
  }

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

 quickLogin() {
  this.router.navigate(
    ['/login'],
    { queryParams: { redirect: this.router.url } }
  );
}

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }

  toggleProfileMenu(event: Event) {
    this.profileMenu.toggle(event);
  }

  openMobileMenu() {
    this.mobileMenuOpen = true;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }
}
