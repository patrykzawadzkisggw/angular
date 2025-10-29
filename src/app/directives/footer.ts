import { Directive, ElementRef, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appFooter]',
  standalone: true
})
export class Footer implements OnInit {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    const year = new Date().getFullYear();
    const text = `Wszystkie prawa zastrzeżone © ${year} logo`;
    this.renderer.setProperty(this.el.nativeElement, 'textContent', text);
  }

}
