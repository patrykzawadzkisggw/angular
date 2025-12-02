import { Component, Input } from '@angular/core';
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

  constructor(private router: Router) {}

  onTagClick(tag: SearchTag) {
    // If the tag has a machine category value, pass it as `category` in URL; otherwise use `q`
    if (tag.category) {
      this.router.navigate(['/search'], { queryParams: { category: tag.category } });
    } else {
      this.router.navigate(['/search'], { queryParams: { q: tag.name } });
    }
  }
}