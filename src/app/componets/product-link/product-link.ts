
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-product-link',
  imports: [RouterLink],
  templateUrl: './product-link.html',
  styleUrl: './product-link.scss',
})
export class ProductLink {
  @Input() product: any;

}
