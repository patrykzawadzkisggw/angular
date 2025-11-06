import { Component } from '@angular/core';
import {
  FormControl,
  FormsModule,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { AbstractControl } from '@angular/forms';

function validTrim(control: AbstractControl) {
  return control.value?.toString().trim().length > 0
    ? null
    : { blank: true };
}

@Component({
  selector: 'app-login-page',
  imports: [
    FormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    ReactiveFormsModule,
    FloatLabelModule,
    MessageModule,
  ],
  templateUrl: './login-page.html',
})
export class LoginPage {
  formError: string | null = null;

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute) {}
  isInvalid(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    this.loginForm.valueChanges.subscribe(() => {
      if (this.formError) {
        this.formError = null;
      }
    });
    return !!control && control?.invalid && (control.dirty || control.touched);
  }
  loginForm = new FormGroup({
    login: new FormControl('', [Validators.required, validTrim]),
    password: new FormControl('', Validators.required),
  });
  
  login() {
    this.formError = null;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { login, password } = this.loginForm.value;

    if (!login || !password) return;

    this.auth.login(login, password).subscribe({
      next: () => {
        const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/';
        this.router.navigateByUrl(redirect);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.formError = err.error?.error ?? 'Nieprawidłowe dane logowania.';
      },
    });
  }
  
  navigateRegister() {
    this.router.navigate(['/register'])
  }
}
