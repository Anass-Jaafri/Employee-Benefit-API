import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  ngOnInit(): void {
    this.form.controls.password.valueChanges.subscribe(() => this.validatePasswordMatch());
    this.form.controls.confirmPassword.valueChanges.subscribe(() => this.validatePasswordMatch());
  }

  private validatePasswordMatch(): void {
    const password = this.form.controls.password.value;
    const confirmPassword = this.form.controls.confirmPassword.value;
    const confirmControl = this.form.controls.confirmPassword;

    if (password && confirmPassword && password !== confirmPassword) {
      confirmControl.setErrors({ ...confirmControl.errors, mismatch: true });
    } else {
      const errors = { ...(confirmControl.errors ?? {}) };
      delete errors['mismatch'];
      confirmControl.setErrors(Object.keys(errors).length ? errors : null);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { firstName, lastName, email, password } = this.form.getRawValue();

    this.auth
      .register({
        firstName: firstName!,
        lastName: lastName!,
        email: email!,
        password: password!,
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/auth/login'], {
            queryParams: { registered: 'true' },
          });
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message ?? 'Registration failed. Please try again.');
        },
      });
  }
}
