import { Component, Input, OnInit } from '@angular/core';
import { ChipModule } from 'primeng/chip';
interface Tag {
  label: string;
  selected: boolean;
}

@Component({
  selector: 'app-filter-tag',
  imports: [ChipModule],
  templateUrl: './filter-tag.html',
  styleUrl: './filter-tag.scss',
})
export class FilterTag implements OnInit {

  @Input() tagsList: string[] = []; 
  tags: Tag[] = [];

  ngOnInit(): void {
    this.tags = [{ label: 'Wszystkie', selected: true }, ...this.tagsList.map(label => ({ label, selected: false }))];
  }

  toggleTag(tag: Tag) {
    if (tag.label === 'Wszystkie') {
      this.tags.forEach(t => t.selected = t.label === 'Wszystkie');
    } else {
      tag.selected = !tag.selected;
      const allTag = this.tags[0];
      if (allTag.selected) {
        allTag.selected = false;
      }
      if (!this.tags.slice(1).some(t => t.selected)) {
        allTag.selected = true;
      }
    }
  }

  getSelectedTags(): string[] {
    if (this.tags[0].selected) return ['Wszystkie'];
    return this.tags.filter(t => t.selected).map(t => t.label);
  }
}