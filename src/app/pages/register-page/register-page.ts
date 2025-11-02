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
  constructor(private auth: AuthService, private router: Router) {}
  isInvalid(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!control && control.invalid && control.touched;
  }
  registerForm = new FormGroup(
    {
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
      confirmPassword: new FormControl('', Validators.required),
    },
    { validators: passwordMatchValidator }
  );

  register() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { username, password } = this.registerForm.value;

    if (!username || !password) return;

    this.auth.register(username, password).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Register error:', err);
      },
    });
  }
}
