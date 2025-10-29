import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-add-input',
  imports: [ButtonModule],
  templateUrl: './add-input.html',
  styleUrl: './add-input.scss',
})
export class AddInput {
  @Input() value = 1;
  @Input() min = 0;
  @Input() max?: number;

  @Output() valueChange = new EventEmitter<number>();
  @Output() removed = new EventEmitter<void>();

  increase() {
    if (this.max !== undefined && this.value >= this.max) return;
    this.value++;
    this.valueChange.emit(this.value);
  }

  decreaseOrRemove() {
    if (this.value > 1) {
      if (this.value <= this.min) return;
      this.value--;
      this.valueChange.emit(this.value);
    } else {
      this.value = Math.max(this.min, 0);
      this.valueChange.emit(this.value);
      this.removed.emit();
    }
  }
}
