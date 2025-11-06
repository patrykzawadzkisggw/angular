import { Component, ViewChild } from '@angular/core';
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
import { map, Observable } from 'rxjs';

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
export class NavbarComponent {
  query = '';
  mobileMenuOpen = false;
  items: MenuItem[] = [];
  cartCount$!: Observable<number>;

  @ViewChild('profileMenu') profileMenu!: Menu;

  constructor(private router: Router, private cart: CartService, private auth: AuthService) {}

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
    this.router.navigate(['/search'], trimmed ? { queryParams: { q: trimmed } } : undefined);
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
