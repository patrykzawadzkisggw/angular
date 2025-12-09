import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ProductService, FilterState } from '../../services/product-service';

@Component({
  selector: 'app-filter-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, DrawerModule, ButtonModule, InputTextModule, SelectModule, CheckboxModule],
  templateUrl: './filter-drawer.html'
})
export class FilterDrawer implements OnInit, OnDestroy {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  filters: FilterState = {};
  minPriceZl: string = '';
  maxPriceZl: string = '';
  sortOptions = [
    { value: 'relevance', label: 'Domyślnie' },
    { value: 'price_asc', label: 'Cena rosnąco' },
    { value: 'price_desc', label: 'Cena malejąco' },
    { value: 'name_asc', label: 'Nazwa A→Z' },
    { value: 'name_desc', label: 'Nazwa Z→A' }
  ];

  private _unsub: (() => void) | null = null;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.filters = this.productService.getFilters();
    this.minPriceZl = this.formatGroszeToZl(this.filters.minPrice);
    this.maxPriceZl = this.formatGroszeToZl(this.filters.maxPrice);
    this._unsub = this.productService.subscribeFilters((f) => {
      this.filters = f;
      this.minPriceZl = this.formatGroszeToZl(this.filters.minPrice);
      this.maxPriceZl = this.formatGroszeToZl(this.filters.maxPrice);
    });
  }

  ngOnDestroy(): void {
    if (this._unsub) this._unsub();
  }

  onVisibleChange(v: boolean) {
    this.visible = !!v;
    this.visibleChange.emit(!!v);
  }

  apply() {
    const minG = this.parseZlToGrosze(this.minPriceZl);
    const maxG = this.parseZlToGrosze(this.maxPriceZl);
    const toSet: Partial<FilterState> = { ...this.filters };
    toSet.minPrice = minG == null ? undefined : minG;
    toSet.maxPrice = maxG == null ? undefined : maxG;
    this.productService.setFilters(toSet);
    this.close();
  }

  reset() {
    this.filters = {};
    this.minPriceZl = '';
    this.maxPriceZl = '';

    this.productService.setFilters({
      minPrice: null,
      maxPrice: null,
      sort: undefined,
      okazja: false,
      inStock: false,
      outOfStock: false
    });
  }

  private parseZlToGrosze(input: string | number | undefined | null): number | null {
    if (input == null) return null;
    const s = String(input).trim();
    if (!s) return null;
    const parts = s.replace(/\s+/g, '').replace(',', '.').split('.');
    const whole = parseInt(parts[0], 10);
    if (isNaN(whole)) return null;
    let frac = 0;
    if (parts.length > 1) {
      const fracRaw = (parts[1] + '00').slice(0, 2);
      const fracNum = parseInt(fracRaw, 10);
      frac = isNaN(fracNum) ? 0 : fracNum;
    }
    return whole * 100 + frac;
  }

  private formatGroszeToZl(grosze?: number | null): string {
    if (grosze == null) return '';
    const whole = Math.floor(grosze / 100);
    const frac = Math.abs(grosze % 100);
    return `${whole},${frac.toString().padStart(2, '0')}`;
  }

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
