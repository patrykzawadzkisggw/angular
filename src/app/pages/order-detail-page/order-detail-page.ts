import { Component, ViewChild } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { Router, RouterLink } from "@angular/router";
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { PopoverModule, Popover } from 'primeng/popover';
@Component({
  selector: 'app-order-detail-page',
  imports: [CardModule, TagModule, TableModule, RouterLink, ButtonModule, DialogModule, PopoverModule],
  templateUrl: './order-detail-page.html',
  styleUrl: './order-detail-page.scss'
})
export class OrderDetailPage {
  @ViewChild('copyPopover') copyPopover!: Popover;

products = [
    { id: 1, name: 'Produkt A', quantity: 2, price: 50, img: 'orange.png' },
    { id: 2, name: 'Produkt B', quantity: 1, price: 100, img: 'orange.png' },
    { id: 3, name: 'Produkt C', quantity: 3, price: 30, img: 'orange.png' },
    { id: 4, name: 'Produkt D', quantity: 2, price: 70, img: 'orange.png' },
]

summary = [
    { label: 'Produkty', value: 330, isBold:false },
     { label: 'Dostawa', value: 0, isBold:false },
      { label: 'Razem', value: 330, isBold:true },
]

visible: boolean = false;

  constructor(private router: Router) {}

  showDialog() {
    this.visible = true;
  }

  cancelOrder() {
    this.visible = false;
    this.router.navigate(['/status']);
  }

  async copyOrderNumber(event: Event) {
    const text = '#1';
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
