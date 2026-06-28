import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { Profile } from '../../shared/models';
import { noWhitespaceValidator } from '../../shared/validators/noWhitespace.validator';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TitleCasePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: `./profile.component.html`,
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  loading = signal(true);
  profileLoading = signal(false);
  passwordLoading = signal(false);

  profileSuccess = signal<string | null>(null);
  profileError = signal<string | null>(null);
  passwordSuccess = signal<string | null>(null);
  passwordError = signal<string | null>(null);

  showCurrent = signal(false);
  showNew = signal(false);

  profile = signal<Profile | null>(null);
  readonly isAdmin = computed(() => this.profile()?.role === 'admin');

  profileForm = this.fb.group({
    firstName: ['', [Validators.required, noWhitespaceValidator]],
    lastName: ['', [Validators.required, noWhitespaceValidator]],
    jobTitle: ['', [noWhitespaceValidator]],
    email: ['', [Validators.required, Validators.email, noWhitespaceValidator]],
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  initials = computed(() => {
    const p = this.profile();
    if (!p) return 'U';
    if (p.role === 'admin') return 'A';
    return `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
  });

  ngOnInit(): void {
    this.passwordForm.controls.newPassword.valueChanges.subscribe(() =>
      this.validatePasswordMatch(),
    );
    this.passwordForm.controls.confirmPassword.valueChanges.subscribe(() =>
      this.validatePasswordMatch(),
    );
    this.loadProfile();
  }

  private validatePasswordMatch(): void {
    const password = this.passwordForm.controls.newPassword.value;
    const confirm = this.passwordForm.controls.confirmPassword.value;
    const control = this.passwordForm.controls.confirmPassword;

    if (password && confirm && password !== confirm) {
      control.setErrors({ ...(control.errors ?? {}), mismatch: true });
    } else {
      const errors = { ...(control.errors ?? {}) };
      delete errors['mismatch'];
      control.setErrors(Object.keys(errors).length ? errors : null);
    }
  }

  loadProfile(): void {
    this.loading.set(true);
    this.auth.getProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.profileForm.patchValue({
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          jobTitle: profile.jobTitle ?? '',
          email: profile.email ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.profileError.set('Failed to load profile');
        this.loading.set(false);
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileLoading.set(true);
    this.profileSuccess.set(null);
    this.profileError.set(null);

    const raw = this.profileForm.getRawValue();

    const payload = {
      firstName: raw.firstName ?? undefined,
      lastName: raw.lastName ?? undefined,
      email: raw.email ?? undefined,
      jobTitle: raw.jobTitle ?? undefined,
    };

    this.auth.updateProfile(payload).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.profileSuccess.set('Profile updated successfully.');
        this.profileLoading.set(false);
      },
      error: (err) => {
        this.profileError.set(err.error?.message ?? 'Failed to update profile.');
        this.profileLoading.set(false);
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordLoading.set(true);
    this.passwordSuccess.set(null);
    this.passwordError.set(null);

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();

    this.auth
      .changePassword({
        currentPassword: currentPassword!,
        newPassword: newPassword!,
      })
      .subscribe({
        next: () => {
          this.passwordSuccess.set('Password updated successfully.');
          this.passwordLoading.set(false);
          this.passwordForm.reset({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        },
        error: (err) => {
          this.passwordError.set(err.error?.message ?? 'Failed to change password.');
          this.passwordLoading.set(false);
        },
      });
  }
}
