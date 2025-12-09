import { Component, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface SearchTag {
  name: string;
  image: string;
  category?: string;
}

@Component({
  selector: 'app-search-tags',
  imports: [CommonModule],
  templateUrl: './search-tags.html',
  styleUrl: './search-tags.scss'
})
export class SearchTags {
  @Input() tags: SearchTag[] = [];
  @Input() isMobile: boolean = false;

  showAllMobile: boolean = false;
  private maxMobileItems: number = 8; 
  private readonly MOBILE_STATE_KEY = 'searchTagsShowAllMobile';

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadMobileState();
    this.updateMaxMobileItems();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateMaxMobileItems();
  }

  private updateMaxMobileItems() {
    if (!this.isMobile) {
      return;
    }

    const minCellWidth = 100;
    const cols = Math.max(1, Math.floor(window.innerWidth / minCellWidth));
    const maxRows = 2;
    this.maxMobileItems = cols * maxRows;
  }

  private loadMobileState() {
    try {
      if (typeof window === 'undefined') return;
      const raw = window.sessionStorage.getItem(this.MOBILE_STATE_KEY);
      if (raw === 'true') {
        this.showAllMobile = true;
      } else if (raw === 'false') {
        this.showAllMobile = false;
      }
    } catch {
    }
  }

  private persistMobileState() {
    try {
      if (typeof window === 'undefined') return;
      window.sessionStorage.setItem(this.MOBILE_STATE_KEY, String(this.showAllMobile));
    } catch {
    }
  }

  private getCollapsedMaxTags(): number {
    return Math.max(0, this.maxMobileItems - 1);
  }

  get mobileVisibleTags(): SearchTag[] {
    if (!this.isMobile) {
      return this.tags;
    }

    if (this.showAllMobile) {
      return this.tags;
    }

    const maxTags = this.getCollapsedMaxTags();

    if (this.tags.length <= maxTags) {
      return this.tags;
    }

    return this.tags.slice(0, maxTags);
  }

  get showMobileToggle(): boolean {
    if (!this.isMobile) {
      return false;
    }

    const maxTags = this.getCollapsedMaxTags();
    return this.tags.length > maxTags;
  }

  toggleMobileTags() {
    this.showAllMobile = !this.showAllMobile;
    this.persistMobileState();
  }

  onTagClick(tag: SearchTag) {
    if (tag.category) {
      this.router.navigate(['/search'], { queryParams: { category: tag.category } });
    } else {
      this.router.navigate(['/search'], { queryParams: { q: tag.name } });
    }
  }
}