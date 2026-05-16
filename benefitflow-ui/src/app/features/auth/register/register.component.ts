import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-register',
    imports: [
        ReactiveFormsModule,
        RouterLink,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
    template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Create your account</mat-card-title>
          <mat-card-subtitle>BenefitFlow — Employee Benefits Management</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
    <!-- Name row -->
            <div class="name-row">
              <mat-form-field appearance="outline">
                <mat-label>First name</mat-label>
                <input matInput formControlName="firstName" autocomplete="given-name" />
                @if (form.controls.firstName.hasError('required') && form.controls.firstName.touched) {
                  <mat-error>First name is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Last name</mat-label>
                <input matInput formControlName="lastName" autocomplete="family-name" />
                @if (form.controls.lastName.hasError('required') && form.controls.lastName.touched) {
                  <mat-error>Last name is required</mat-error>
                }
              </mat-form-field>
            </div>

            <!-- Email -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              @if (form.controls.email.hasError('required') && form.controls.email.touched) {
                <mat-error>Email is required</mat-error>
              }
              @if (form.controls.email.hasError('email') && form.controls.email.touched) {
                <mat-error>Enter a valid email address</mat-error>
              }
            </mat-form-field>

            <!-- Password -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput
                     [type]="showPassword() ? 'text' : 'password'"
                     formControlName="password"
                     autocomplete="new-password" />
              <button mat-icon-button matSuffix type="button"
                      (click)="showPassword.set(!showPassword())">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.controls.password.hasError('required') && form.controls.password.touched) {
                <mat-error>Password is required</mat-error>
              }
              @if (form.controls.password.hasError('minlength') && form.controls.password.touched) {
                <mat-error>Password must be at least 8 characters</mat-error>
              }
            </mat-form-field>

            <!-- Confirm Password -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm password</mat-label>
              <input matInput
                     [type]="showPassword() ? 'text' : 'password'"
                     formControlName="confirmPassword"
                     autocomplete="new-password" />
              @if (form.controls.confirmPassword.hasError('required') && form.controls.confirmPassword.touched) {
                <mat-error>Please confirm your password</mat-error>
              }
              @if (form.controls.confirmPassword.hasError('mismatch') && form.controls.confirmPassword.touched) {
                <mat-error>Passwords do not match</mat-error>
              }
            </mat-form-field>

            <!-- API error -->
            @if (error()) {
              <p class="api-error">{{ error() }}</p>
            }

            <!-- Submit -->
            <button mat-raised-button color="primary" class="full-width submit-btn"
                    type="submit" [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="20" />
              } @else {
                Create account
              }
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <p class="login-link">
            Already have an account? <a routerLink="/auth/login">Sign in</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
    styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      padding: 24px;
    }

    .auth-card {
      width: 100%;
      max-width: 480px;
      padding: 8px;
    }

    mat-card-header {
      margin-bottom: 24px;
    }

    .name-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .name-row mat-form-field {
      width: 100%;
    }

    .full-width {
      width: 100%;
    }

    .submit-btn {
      margin-top: 8px;
      height: 44px;
    }

    .api-error {
      color: var(--mat-sys-error, #b00020);
      font-size: 14px;
      margin: 0 0 12px;
    }

    .login-link {
      text-align: center;
      font-size: 14px;
      width: 100%;
      margin: 0;
    }

    mat-card-actions {
      justify-content: center;
      padding: 16px;
    }
  `],
})
export class RegisterComponent {
    private fb = inject(FormBuilder);
    private auth = inject(AuthService);
    private router = inject(Router);

    loading = signal(false);
    error = signal<string | null>(null);
    showPassword = signal(false);

    form = this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
    });

    ngOnInit() {

        this.form.controls.password.valueChanges.subscribe(() => this.validatePasswordMatch());
        this.form.controls.confirmPassword.valueChanges.subscribe(() => this.validatePasswordMatch());
    }

    private validatePasswordMatch() {
        const password = this.form.controls.password.value;
        const confirmPassword = this.form.controls.confirmPassword.value;
        const confirmControl = this.form.controls.confirmPassword;

        if (password && confirmPassword && password !== confirmPassword) {
            confirmControl.setErrors({ ...confirmControl.errors, mismatch: true });
        } else {
            const errors = { ...confirmControl.errors };
            delete errors['mismatch'];
            confirmControl.setErrors(Object.keys(errors).length ? errors : null);
        }
    }

    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched;
            return;
        }

        this.loading.set(true);
        this.error.set(null);
        const { firstName, lastName, email, password } = this.form.getRawValue();

        this.auth.register({ firstName: firstName!, lastName: lastName!, email: email!, password: password! })
            .subscribe({
                next: () => {
                    // Navigate to login; query param triggers a success banner there
                    this.router.navigate(['/auth/login'], { queryParams: { registered: 'true' } });
                },
                error: (err) => {
                    this.loading.set(false);
                    this.error.set(err.error?.message ?? 'Registration failed. Please try again.');
                },
            });
    }
}