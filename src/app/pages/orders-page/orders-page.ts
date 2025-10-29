import { Component } from '@angular/core';
import { FilterTag } from '../../componets/filter-tag/filter-tag';
import { OrdersItem } from '../../componets/orders-item/orders-item';

@Component({
  selector: 'app-orders-page',
  imports: [FilterTag, OrdersItem],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.scss'
})
export class OrdersPage {
  tags = ['Dostarczone', 'Anulowane', 'W drodze'];

}
