import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
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
export class FilterTag implements OnInit, OnChanges {

  @Input() tagsList: string[] = []; 
  @Input() selected: string[] = [];
  tags: Tag[] = [];
  @Output() selectionChange = new EventEmitter<string[]>();

  ngOnInit(): void {
    this.tags = [{ label: 'Wszystkie', selected: true }, ...this.tagsList.map(label => ({ label, selected: false }))];
    if (this.selected && this.selected.length) {
      this.applySelected(this.selected);
    }
    this.selectionChange.emit(this.getSelectedTags());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selected'] && this.tags.length) {
      this.applySelected(this.selected || []);
    }
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
    this.selectionChange.emit(this.getSelectedTags());
  }

  private applySelected(selected: string[]) {
    const useAll = !selected.length || selected.includes('Wszystkie');
    if (useAll) {
      this.tags.forEach((t, idx) => t.selected = idx === 0);
      return;
    }
    this.tags.forEach(t => t.selected = false);
    const set = new Set(selected);
    this.tags.forEach(t => {
      if (t.label !== 'Wszystkie') {
        t.selected = set.has(t.label);
      }
    });
    if (!this.tags.slice(1).some(t => t.selected)) {
      this.tags[0].selected = true;
    }
  }

  getSelectedTags(): string[] {
    if (this.tags[0].selected) return ['Wszystkie'];
    return this.tags.filter(t => t.selected).map(t => t.label);
  }
}