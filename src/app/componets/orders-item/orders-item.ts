import { Component, Input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-orders-item',
  imports: [CardModule, TagModule, RouterLink],
  templateUrl: './orders-item.html',
  styleUrl: './orders-item.scss',
})
export class OrdersItem {
  @Input() order!: {
    id: number;
    status: 'Dostarczone' | 'Anulowane' | 'W drodze';
    date: string;
    total: number;
    itemsCount: number;
    images: string[];
  };

  get severity(): 'success' | 'info' | 'warn' | 'danger' {
    switch (this.order?.status) {
      case 'Dostarczone':
        return 'success';
      case 'Anulowane':
        return 'danger';
      case 'W drodze':
        return 'info';
      default:
        return 'info';
    }
  }
}
