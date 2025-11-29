import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [CardModule, ButtonModule],
  templateUrl: './not-found-page.html',
})
export class NotFoundPage {
  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/']);
  }

  goBack() {
    if (history.length > 1) history.back();
    else this.goHome();
  }
}