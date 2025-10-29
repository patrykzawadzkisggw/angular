import { Component } from '@angular/core';
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

}
