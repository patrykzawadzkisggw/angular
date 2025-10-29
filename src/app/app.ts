import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Footer } from "./directives/footer";
import { NavbarComponent } from './componets/navbar-component/navbar-component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ButtonModule, Footer, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('projekt');
}
