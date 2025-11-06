import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FilterTag } from '../../componets/filter-tag/filter-tag';
import { OrdersItem } from '../../componets/orders-item/orders-item';
import { OrderService, Order as ServerOrder } from '../../services/order-service';
import { Subscription } from 'rxjs';

interface UiOrder {
  id: number;
  status: 'Dostarczone' | 'Anulowane' | 'W drodze';
  date: string;
  total: number;
  itemsCount: number;
  images: string[];
}

@Component({
  selector: 'app-orders-page',
  imports: [FilterTag, OrdersItem],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.scss'
})
export class OrdersPage implements OnInit, OnDestroy {
  tags = ['Dostarczone', 'Anulowane', 'W drodze'];

  orders: UiOrder[] = [];
  selectedTags: string[] = ['Wszystkie'];
  loading = false;
  error: string | null = null;

  private subs = new Subscription();

  constructor(private route: ActivatedRoute, private router: Router, private orderService: OrderService) {}

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap.get('status');
    const selected = (qp ? qp.split(',').map(s => s.trim()).filter(Boolean) : []) as string[];
    this.selectedTags = selected.length ? selected : ['Wszystkie'];
  const nav = this.router.getCurrentNavigation();
  const forceReload = !this.orderService.hasCache() && nav == null;

    this.loading = true;
    this.error = null;

    const fetchSub = this.orderService.getOrders(forceReload).subscribe({
      next: (orders) => {
        this.setOrdersFromServer(orders);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        this.error = 'Nie udało się pobrać zamówień';
        this.loading = false;
      }
    });

    this.subs.add(fetchSub);

    const changesSub = this.orderService.orders$.subscribe((orders) => {
      if (orders) this.setOrdersFromServer(orders);
    });
    this.subs.add(changesSub);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private setOrdersFromServer(orders: ServerOrder[]) {
    this.orders = orders.map(o => ({
      id: o.id,
      status: this.normalizeStatus(String((o as any).status)),
  date: o.created_at,
      total: (o.total_cents || 0) / 100,
      itemsCount: o.total_items,
      images: o.images || []
    }));
  }

  private normalizeStatus(s: string): 'Dostarczone' | 'Anulowane' | 'W drodze' {
    const v = (s || '').toLowerCase();
    if (v.includes('dostarcz')) return 'Dostarczone';
    if (v.includes('anul')) return 'Anulowane';
    if (v.includes('w dro')) return 'W drodze';
    return 'W drodze';
  }

  get filteredOrders() {
    if (!this.selectedTags.length || this.selectedTags.includes('Wszystkie')) {
      return this.orders;
    }
    return this.orders.filter(o => this.selectedTags.includes(o.status));
  }

  onFilterChange(tags: string[]) {
    this.selectedTags = tags;
    const useAll = !tags.length || tags.includes('Wszystkie');
    const queryParams = useAll ? { status: null } : { status: tags.join(',') };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

}
