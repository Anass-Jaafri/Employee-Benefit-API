import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/services/auth.service';
import { Profile } from '../../shared/models';

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule, TitleCasePipe,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDividerModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="profile-wrapper">

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="48" /></div>
      } @else {

        <!-- Avatar header -->
        <div class="profile-header">
          <div class="avatar">{{ initials() }}</div>
          <div class="header-info">
            <h2 class="display-name">{{ profile()?.firstName }} {{ profile()?.lastName }}</h2>
            <span class="role-badge">{{ profile()?.role | titlecase }}</span>
            <span class="jobTitle">{{ profile()?.jobTitle }}</span>
            @if (profile()?.company) {
              <span class="company-name">{{ profile()!.company!.name }}</span>
            }
          </div>
        </div>

        <div class="cards-layout">

          <!-- Personal info -->
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>person</mat-icon>
              <mat-card-title>Personal Information</mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <form [formGroup]="profileForm" (ngSubmit)="submitProfile()">

                <div class="name-row">
                  <mat-form-field appearance="outline">
                    <mat-label>First name</mat-label>
                    <input matInput formControlName="firstName" />
                    @if (profileForm.controls.firstName.hasError('required') && profileForm.controls.firstName.touched) {
                      <mat-error>First name is required</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Last name</mat-label>
                    <input matInput formControlName="lastName" />
                    @if (profileForm.controls.lastName.hasError('required') && profileForm.controls.lastName.touched) {
                      <mat-error>Last name is required</mat-error>
                    }
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" formControlName="email" />
                  @if (profileForm.controls.email.hasError('required') && profileForm.controls.email.touched) {
                    <mat-error>Email is required</mat-error>
                  }
                  @if (profileForm.controls.email.hasError('email') && profileForm.controls.email.touched) {
                    <mat-error>Enter a valid email</mat-error>
                  }
                </mat-form-field>

                <!-- Read-only fields -->
                <div class="readonly-row">
                  <div class="readonly-field">
                    <span class="readonly-label">Role</span>
                    <span class="readonly-value">{{ profile()?.role | titlecase }}</span>
                  </div>
                  <div class="readonly-field">
                    <span class="readonly-label">Status</span>
                    <span class="readonly-value">{{ profile()?.status | titlecase }}</span>
                  </div>
                 
                  @if (profile()?.company) {
                    <div class="readonly-field">
                      <span class="readonly-label">Company</span>
                      <span class="readonly-value">{{ profile()!.company!.name }}</span>
                    </div>
                  }
                </div>

                @if (profileSuccess()) {
                  <p class="success-msg">{{ profileSuccess() }}</p>
                }
                @if (profileError()) {
                  <p class="error-msg">{{ profileError() }}</p>
                }

                <div class="form-actions">
                  <button mat-raised-button color="primary"
                          type="submit" [disabled]="profileLoading()">
                    @if (profileLoading()) {
                      <mat-spinner diameter="20" />
                    } @else {
                      Save changes
                    }
                  </button>
                </div>

              </form>
            </mat-card-content>
          </mat-card>

          <!-- Change password -->
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>lock</mat-icon>
              <mat-card-title>Change Password</mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <form [formGroup]="passwordForm" (ngSubmit)="submitPassword()">

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Current password</mat-label>
                  <input matInput
                         [type]="showCurrent() ? 'text' : 'password'"
                         formControlName="currentPassword" />
                  <button mat-icon-button matSuffix type="button"
                          (click)="showCurrent.set(!showCurrent())">
                    <mat-icon>{{ showCurrent() ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                  @if (passwordForm.controls.currentPassword.hasError('required') && passwordForm.controls.currentPassword.touched) {
                    <mat-error>Current password is required</mat-error>
                  }
                </mat-form-field>

                <mat-divider class="form-divider" />

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>New password</mat-label>
                  <input matInput
                         [type]="showNew() ? 'text' : 'password'"
                         formControlName="newPassword" />
                  <button mat-icon-button matSuffix type="button"
                          (click)="showNew.set(!showNew())">
                    <mat-icon>{{ showNew() ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                  @if (passwordForm.controls.newPassword.hasError('required') && passwordForm.controls.newPassword.touched) {
                    <mat-error>New password is required</mat-error>
                  }
                  @if (passwordForm.controls.newPassword.hasError('minlength') && passwordForm.controls.newPassword.touched) {
                    <mat-error>Password must be at least 8 characters</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Confirm new password</mat-label>
                  <input matInput
                         [type]="showNew() ? 'text' : 'password'"
                         formControlName="confirmPassword" />
                  @if (passwordForm.controls.confirmPassword.hasError('required') && passwordForm.controls.confirmPassword.touched) {
                    <mat-error>Please confirm your new password</mat-error>
                  }
                  @if (passwordForm.controls.confirmPassword.hasError('mismatch') && passwordForm.controls.confirmPassword.touched) {
                    <mat-error>Passwords do not match</mat-error>
                  }
                </mat-form-field>

                @if (passwordSuccess()) {
                  <p class="success-msg">{{ passwordSuccess() }}</p>
                }
                @if (passwordError()) {
                  <p class="error-msg">{{ passwordError() }}</p>
                }

                <div class="form-actions">
                  <button mat-raised-button color="primary"
                          type="submit" [disabled]="passwordLoading()">
                    @if (passwordLoading()) {
                      <mat-spinner diameter="20" />
                    } @else {
                      Change password
                    }
                  </button>
                </div>

              </form>
            </mat-card-content>
          </mat-card>

        </div>
      }
    </div>
  `,
  styles: [`
    .profile-wrapper  { padding: 24px; max-width: 900px; margin: 0 auto; }
    .loading-center   { display: flex; justify-content: center; padding: 80px; }

    /* Header */
    .profile-header {
      display: flex; align-items: center; gap: 24px;
      margin-bottom: 32px;
    }
    .avatar {
      width: 72px; height: 72px; border-radius: 50%;
      background: #1976d2; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 26px; font-weight: 700; flex-shrink: 0;
    }
    .display-name  { font-size: 22px; font-weight: 600; margin: 0 0 6px; }
    .role-badge {
      display: inline-block; padding: 2px 10px; border-radius: 12px;
      background: #e3f2fd; color: #1565c0;
      font-size: 12px; font-weight: 500; margin-right: 8px;
    }
    .company-name { font-size: 13px; color: rgba(0,0,0,0.55); }
    .jobTitle { font-size: 13px; color: rgba(0,0,0,0.55); padding: 2px 10px; }

    /* Layout */
    .cards-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      align-items: start;
    }
    @media (max-width: 700px) {
      .cards-layout { grid-template-columns: 1fr; }
    }

    /* Forms */
    .name-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    }
    .name-row mat-form-field { width: 100%; }
    .full-width { width: 100%; }

    /* Read-only fields */
    .readonly-row    { display: flex; flex-wrap: wrap; gap: 24px; margin: 8px 0 16px; }
    .readonly-field  { display: flex; flex-direction: column; gap: 2px; }
    .readonly-label  { font-size: 11px; text-transform: uppercase; color: rgba(0,0,0,0.45); letter-spacing: 0.5px; }
    .readonly-value  { font-size: 14px; font-weight: 500; }

    .form-divider  { margin: 8px 0 16px; }
    .form-actions  { display: flex; justify-content: flex-end; margin-top: 8px; }

    /* Feedback */
    .success-msg { color: #2e7d32; background: #e8f5e9; padding: 10px 14px; border-radius: 4px; font-size: 14px; margin: 0 0 12px; }
    .error-msg   { color: #c62828; background: #ffebee; padding: 10px 14px; border-radius: 4px; font-size: 14px; margin: 0 0 12px; }
  `],
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  // ── State ────────────────────────────────────────────────
  loading = signal(true);
  profile = signal<Profile | null>(null);
  profileLoading = signal(false);
  passwordLoading = signal(false);
  profileSuccess = signal<string | null>(null);
  profileError = signal<string | null>(null);
  passwordSuccess = signal<string | null>(null);
  passwordError = signal<string | null>(null);
  showCurrent = signal(false);
  showNew = signal(false);

  // ── Computed ─────────────────────────────────────────────
  readonly initials = computed(() => {
    const p = this.profile();
    if (!p) return '?';
    return `${p.firstName.charAt(0)}${p.lastName.charAt(0)}`.toUpperCase();
  });

  // ── Forms ─────────────────────────────────────────────────
  profileForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    jobTitle: [''],
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  // ── Lifecycle ─────────────────────────────────────────────
  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.profileForm.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          jobTitle: profile.jobTitle ?? '',
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.passwordForm.controls.newPassword.valueChanges
      .subscribe(() => this.validatePasswordMatch());
    this.passwordForm.controls.confirmPassword.valueChanges
      .subscribe(() => this.validatePasswordMatch());
  }

  // ── Validation ────────────────────────────────────────────
  private validatePasswordMatch(): void {
    const newPass = this.passwordForm.controls.newPassword.value;
    const confirm = this.passwordForm.controls.confirmPassword.value;
    const control = this.passwordForm.controls.confirmPassword;

    if (newPass && confirm && newPass !== confirm) {
      control.setErrors({ ...control.errors, mismatch: true });
    } else {
      const errors = { ...control.errors };
      delete errors['mismatch'];
      control.setErrors(Object.keys(errors).length ? errors : null);
    }
  }

  // ── Submit: profile ───────────────────────────────────────
  submitProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileLoading.set(true);
    this.profileSuccess.set(null);
    this.profileError.set(null);

    const { firstName, lastName, email, jobTitle } = this.profileForm.getRawValue();

    this.authService.updateProfile({
      firstName: firstName!,
      lastName: lastName!,
      email: email!,
      jobTitle: jobTitle || undefined,
    }).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.profileLoading.set(false);
        this.profileSuccess.set('Profile updated successfully');
        setTimeout(() => this.profileSuccess.set(null), 3000);
      },
      error: (err) => {
        this.profileLoading.set(false);
        this.profileError.set(err.error?.message ?? 'Failed to update profile');
      },
    });
  }

  // ── Submit: password ──────────────────────────────────────
  submitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordLoading.set(true);
    this.passwordSuccess.set(null);
    this.passwordError.set(null);

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();

    this.authService.changePassword({
      currentPassword: currentPassword!,
      newPassword: newPassword!,
    }).subscribe({
      next: () => {
        this.passwordLoading.set(false);
        this.passwordSuccess.set('Password changed successfully');
        this.passwordForm.reset();
        setTimeout(() => this.passwordSuccess.set(null), 3000);
      },
      error: (err) => {
        this.passwordLoading.set(false);
        this.passwordError.set(err.error?.message ?? 'Failed to change password');
      },
    });
  }
}