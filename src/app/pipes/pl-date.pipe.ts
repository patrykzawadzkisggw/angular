import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'plDate',
  standalone: true,
})
export class PlDatePipe implements PipeTransform {
  transform(value: string | Date | number | null | undefined): string {
    if (!value) return '';
    let d: Date;
    if (value instanceof Date) {
      d = value;
    } else if (typeof value === 'number') {
      d = new Date(value);
    } else if (typeof value === 'string') {
      const parsed = new Date(value);
      if (isNaN(parsed.getTime())) {
        const t = Date.parse(value);
        if (isNaN(t)) return value;
        d = new Date(t);
      } else {
        d = parsed;
      }
    } else {
      return String(value);
    }

    try {
      return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    } catch {
      return d.toLocaleDateString();
    }
  }
}
