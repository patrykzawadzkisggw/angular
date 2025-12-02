
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-product-link',
  imports: [RouterLink, CommonModule, DecimalPipe],
  templateUrl: './product-link.html',
  styleUrl: './product-link.scss',
})
export class ProductLink {
  @Input() product: any;

}
