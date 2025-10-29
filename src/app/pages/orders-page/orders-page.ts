import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FilterTag } from '../../componets/filter-tag/filter-tag';
import { OrdersItem } from '../../componets/orders-item/orders-item';

@Component({
  selector: 'app-orders-page',
  imports: [FilterTag, OrdersItem],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.scss'
})
export class OrdersPage implements OnInit {
  tags = ['Dostarczone', 'Anulowane', 'W drodze'];

  orders = [
    { id: 1, status: 'Dostarczone' as const, date: '22 kwietnia 2027', total: 54, itemsCount: 6, images: ['orange.png','orange.png','orange.png','orange.png'] },
    { id: 2, status: 'W drodze' as const,     date: '10 maja 2027',     total: 129, itemsCount: 3, images: ['orange.png','orange.png','orange.png'] },
    { id: 3, status: 'Anulowane' as const,    date: '2 czerwca 2027',   total: 75, itemsCount: 2, images: ['orange.png','orange.png'] },
    { id: 4, status: 'Dostarczone' as const,  date: '1 lipca 2027',     total: 200, itemsCount: 8, images: ['orange.png','orange.png','orange.png','orange.png','orange.png'] },
  ];

  selectedTags: string[] = ['Wszystkie'];
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap.get('status');
    const selected = (qp ? qp.split(',').map(s => s.trim()).filter(Boolean) : []) as string[];
    this.selectedTags = selected.length ? selected : ['Wszystkie'];
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
