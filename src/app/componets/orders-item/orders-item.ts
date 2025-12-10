import { Component, Input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { RouterLink } from "@angular/router";
import { PlDatePipe } from '../../pipes/pl-date.pipe';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-orders-item',
  imports: [CardModule, TagModule, RouterLink, PlDatePipe, DecimalPipe],
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
