import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../services/order-service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BlockUIModule } from 'primeng/blockui';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-status-page',
  standalone: true,
  templateUrl: './status-page.html',
  styleUrl: './status-page.scss',
  imports: [CardModule, ButtonModule, BlockUIModule, ProgressSpinnerModule],
})
export class StatusPage implements OnInit {
  status: string | null = null;
  isSuccess: boolean = false;
  orderId: string | null = null;
  constructor(
    private route: ActivatedRoute,
    private orders: OrderService,
    private router: Router
  ) {}

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id');
    if (!this.orderId) return;

    const nav = this.router.getCurrentNavigation();
    const state = (nav && (nav.extras as any)?.state) ? (nav.extras as any).state : (history.state || {});
    if (state?.fromCancel) {
      if (state.canceled === true) {
        this.status = 'Zamówienie zostało anulowane';
        this.isSuccess = false;
        return;
      }
    }

    this.orders.getOrderStatus(this.orderId).subscribe({
      next: (s) => {
        if (s === 'zamowienie zlozono') {
          this.status = 'Zamówienie zostało złożone';
          this.isSuccess = true;
        } else if (s === 'zamowienie anulowane') {
          this.status = 'Zamówienie zostało anulowane';
        } else if (s === 'nie udalo sie zlozyc zamowienia') {
          this.status = 'Nie udało się złożyć zamówienia';
        } else {
          this.status = 'Wystąpił błąd podczas sprawdzania statusu zamówienia';
        }
        return;
      },
      error: () =>
        (this.status = this.status = 'Wystąpił błąd podczas sprawdzania statusu zamówienia'),
    });
  }
  goHome() {
    this.router.navigate(['/']);
  }
  goToOrder() {
    this.router.navigate(['orders', this.orderId]);
  }
}
