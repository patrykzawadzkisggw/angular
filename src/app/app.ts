import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Footer } from "./directives/footer";
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ButtonModule, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('projekt');
}
