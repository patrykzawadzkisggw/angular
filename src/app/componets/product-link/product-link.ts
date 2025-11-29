
import { Component, Input } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-product-link',
  imports: [RouterLink],
  templateUrl: './product-link.html',
  styleUrl: './product-link.scss',
})
export class ProductLink {
  @Input() product: any;

  

}
