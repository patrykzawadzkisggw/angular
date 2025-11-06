import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderDetailService } from '../../services/order-detail-service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-status-page',
  standalone: true,
  templateUrl: './status-page.html',
  styleUrl: './status-page.scss',
  imports: [CardModule, ButtonModule],
})
export class StatusPage implements OnInit {
  status: string | null = null;
  isSuccess: boolean = false;
  orderId: string | null = null;
  constructor(
    private route: ActivatedRoute,
    private orders: OrderDetailService,
    private router: Router
  ) {}

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id');
    if (!this.orderId) return;

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
