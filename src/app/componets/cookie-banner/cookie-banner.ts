import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './cookie-banner.html',
})
export class CookieBanner implements OnInit {
  showBanner = false;
  
  private readonly acceptedKey = 'cookie_banner_accepted_v1';

  ngOnInit() {
    try {
      const accepted = localStorage.getItem(this.acceptedKey);
      this.showBanner = accepted !== 'true';
    } catch {
      this.showBanner = true;
    }
  }

  acceptAll() {
    try {
      localStorage.setItem(this.acceptedKey, 'true');
    } catch {}
    
    this.showBanner = false;
  }
  
}
