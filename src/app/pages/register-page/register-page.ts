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
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const passControl = control.get('password');
  const confirmControl = control.get('confirmPassword');

  if (!passControl || !confirmControl) return null;

  if (passControl.value !== confirmControl.value) {
    confirmControl.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  } else {
    if (confirmControl.hasError('passwordMismatch')) {
      confirmControl.setErrors(null);
    }
    return null;
  }
}
function validTrim(control: AbstractControl) {
  return control.value?.toString().trim().length > 0
    ? null
    : { blank: true };
}

@Component({
  selector: 'app-register-page',
  imports: [
    FormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    ReactiveFormsModule,
    FloatLabelModule,
    MessageModule,
  ],
  templateUrl: './register-page.html',
})
export class RegisterPage {
  formError: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}
  isInvalid(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    this.registerForm.valueChanges.subscribe(() => {
      if (this.formError) {
        this.formError = null;
      }
    });
    return !!control && control?.invalid && (control.dirty || control.touched);
  }
  registerForm = new FormGroup(
    {
      username: new FormControl('', [Validators.required, validTrim]),
      password: new FormControl('', Validators.required),
      confirmPassword: new FormControl('', Validators.required),
    },
    { validators: passwordMatchValidator }
  );

  register() {
    this.formError = null;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { username, password } = this.registerForm.value;

    if (!username || !password) return;

    this.auth.register(username, password).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Register error:', err);
        this.formError = err.error?.error ?? 'Nieprawidłowe dane logowania.';
      },
    });
  }

  navigateLogin() {
    this.router.navigate(['/login']);
  }
}
