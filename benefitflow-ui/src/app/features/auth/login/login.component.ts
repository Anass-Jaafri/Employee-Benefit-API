// features/auth/login/login.component.ts
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
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
  @if (registered()) {
  <p class="success-banner">
    Account created! Sign in to continue.
  </p>
}
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Welcome back</mat-card-title>
          <mat-card-subtitle>Sign in to BenefitFlow</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">

            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
              @if (form.controls.email.hasError('required')) {
                <mat-error>Email is required</mat-error>
              } @else if (form.controls.email.hasError('email')) {
                <mat-error>Enter a valid email</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="password" />
              <button mat-icon-button matSuffix type="button" (click)="showPassword.set(!showPassword())">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.controls.password.hasError('required')) {
                <mat-error>Password is required</mat-error>
              }
            </mat-form-field>

            @if (error()) {
              <p class="error-message">{{ error() }}</p>
            }

            <button
              mat-flat-button
              type="submit"
              [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="20" />
              } @else {
                Sign in
              }
            </button>

          </form>
        </mat-card-content>

        <mat-card-actions>
          <p>Don't have an account? <a routerLink="/auth/register">Register</a></p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 16px;
    }
    mat-card-header {
      margin-bottom: 24px;
    }
    mat-form-field {
      width: 100%;
      margin-bottom: 8px;
    }
    button[type=submit] {
      width: 100%;
      margin-top: 8px;
    }
    .error-message {
      color: var(--mat-sys-error);
      font-size: 14px;
      margin: 0 0 8px;
    }
    mat-card-actions {
      justify-content: center;
      padding: 16px;
    }
    .success-banner {
  color: #2e7d32;       /* Material green-800 */
  background: #e8f5e9;
  border-radius: 4px;
  padding: 10px 14px;
  font-size: 14px;
  margin-bottom: 16px;
}
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  registered = signal(false);

  showPassword = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  ngOnInit() {
    this.registered.set(this.route.snapshot.queryParamMap.get('registered') === 'true');
  }
  submit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.form.value;

    this.authService.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard/home']),
      error: (err) => {
        this.error.set(err.error?.message ?? 'Something went wrong. Please try again.');
        this.loading.set(false);
      },
    });
  }
}