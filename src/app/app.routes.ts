import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { CartPage } from './pages/cart-page/cart-page';
import { DeliveryPage } from './pages/delivery-page/delivery-page';
import { LoginPage } from './pages/login-page/login-page';
import { RegisterPage } from './pages/register-page/register-page';
import { SearchPage } from './pages/search-page/search-page';
import { OrdersPage } from './pages/orders-page/orders-page';
import { StatusPage } from './pages/status-page/status-page';
import { OrderDetailPage } from './pages/order-detail-page/order-detail-page';
import { ProductPage } from './pages/product-page/product-page';
import { NotFoundPage } from './pages/not-found-page/not-found-page';
import { authGuard } from './guards/auth.guard';
import { loggedInAuthGuard } from './guards/loggedInAuthGuard.guard';

export const routes: Routes = [
    {path: '', component: HomePage},
    {path: 'home', redirectTo: ''},
    {path: 'index', redirectTo: ''},
    {path: 'cart', component: CartPage},
    {path: 'delivery', component: DeliveryPage, canActivate: [authGuard]},
    {path: 'login', component: LoginPage, canActivate: [loggedInAuthGuard]},
    {path: 'register', component: RegisterPage, canActivate: [loggedInAuthGuard]},
    {path: 'search', component: SearchPage},
    {path: 'orders', component: OrdersPage, canActivate: [authGuard]},
    {path: 'orders/:id', component: OrderDetailPage, canActivate: [authGuard]},
    {path: 'orders/:id/status', component: StatusPage, canActivate: [authGuard]},
    {path: 'product/:id', component: ProductPage},
    {path: '**', component: NotFoundPage},
];
