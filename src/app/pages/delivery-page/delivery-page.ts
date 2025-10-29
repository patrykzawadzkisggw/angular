import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { Router, RouterLink } from "@angular/router";
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { StepperModule } from 'primeng/stepper';
import { ProgressBarModule } from 'primeng/progressbar';
import { InputOtpModule } from 'primeng/inputotp';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';
@Component({
  selector: 'app-delivery-page',
  imports: [CommonModule, FormsModule, CardModule, TagModule, TableModule, RouterLink, ButtonModule, DialogModule, StepperModule, ProgressBarModule, InputOtpModule, InputTextModule, IftaLabelModule],
  templateUrl: './delivery-page.html',
  styleUrl: './delivery-page.scss'
})
export class DeliveryPage {
  constructor(private router: Router) {}

  onStepChange(value: number | undefined) {
    if (value === 1) {
      this.router.navigateByUrl('/cart');
    } else if (value === 2) {
      // Stay or ensure we are on delivery
      this.router.navigateByUrl('/delivery');
    }
  }
}
