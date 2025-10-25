import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
@Component({
  selector: 'app-home-page',
  imports: [CardModule,ButtonModule, DialogModule, InputTextModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss'
})
export class HomePage {
visible: boolean = false;

  showDialog(): void {
    this.visible = true;
  }
}
