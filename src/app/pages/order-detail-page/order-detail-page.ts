import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { Router, ActivatedRoute, RouterLink } from "@angular/router";
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { PopoverModule, Popover } from 'primeng/popover';
import { OrderService, OrderDetail } from '../../services/order-service';
import { NotFoundPage } from '../not-found-page/not-found-page';
@Component({
  selector: 'app-order-detail-page',
  imports: [CommonModule, CardModule, TagModule, TableModule, RouterLink, ButtonModule, DialogModule, PopoverModule, NotFoundPage],
  templateUrl: './order-detail-page.html',
  styleUrl: './order-detail-page.scss'
})
export class OrderDetailPage implements OnInit {
  @ViewChild('copyPopover') copyPopover!: Popover;
  order?: OrderDetail;
  loading = false;
  error: string | null = null;
  visible: boolean = false;
  cancelling = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private orderDetailService: OrderService,
    private orderService: OrderService,
  ) {}

  showDialog() {
    this.visible = true;
  }

  cancelOrder() {
    const id = this.order?.id;
    this.cancelling = true;
    this.visible = false;
    if (id) {
      this.orderDetailService.cancelOrder(id).subscribe({
        next: () => {
          this.cancelling = false;
          try { this.orderService.notifyOrdersChanged(); } catch {}
          this.router.navigate(['orders', id, 'status'], { state: { fromCancel: true, canceled: true } });
        },
        error: () => {
          this.cancelling = false;
          this.router.navigate(['orders', id, 'status'], { state: { fromCancel: true, canceled: false } });
        }
      });
    } else {
      this.cancelling = false;
      this.router.navigate(['/orders']);
    }
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(pm => {
      const idStr = pm.get('id');
      const id = idStr ? Number(idStr) : NaN;
      if (!id || isNaN(id)) {
        this.error = 'Niepoprawny identyfikator zamówienia';
        return;
      }

  const nav = this.router.getCurrentNavigation();
  const forceReload = !this.orderService.hasCache() && nav == null;

      this.loading = true;
      this.error = null;
      this.orderService.getOrder(id, forceReload).subscribe({
          next: (o: OrderDetail) => {
            this.order = o;
            const productsCents = (o.items || []).reduce((s: number, it: any) => s + (it.price_cents || 0) * (it.quantity || 0), 0);
          const discountCents = o.discount_cents || 0;
          const shippingCents = o.delivery_cents || 0;
          const totalWithShippingCents = (o.total_cents || 0);
          this.summary = [
            { label: 'Produkty', value: productsCents / 100, isBold: false },
            { label: 'Dostawa', value: shippingCents / 100, isBold: false },
            { label: 'Rabaty', value: discountCents / 100, isBold: false },
            { label: 'Razem', value: totalWithShippingCents / 100, isBold: true }
          ];
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Failed to load order', err);
          this.error = 'Nie udało się pobrać zamówienia';
          this.loading = false;
        }
      });
    });
  }

  summary = [
    { label: 'Produkty', value: 330, isBold:false },
     { label: 'Dostawa', value: 0, isBold:false },
        { label: 'Rabaty', value: 0, isBold:false },
      { label: 'Razem', value: 330, isBold:true },
]

  async copyOrderNumber(event: Event) {
    const text = this.order ? ('#' + this.order.id) : '#';
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } finally {
      this.copyPopover?.show(event);
      setTimeout(() => this.copyPopover?.hide(), 1200);
    }
  }
}
