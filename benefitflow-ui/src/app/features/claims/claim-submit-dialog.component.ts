// features/claims/claim-submit-dialog.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ClaimsService } from './claims.service';
import { BenefitPackagesService } from '../benefit-packages/benefit-packages.service';
import { BenefitPackage } from '../../shared/models';
import { noWhitespaceValidator } from '../../shared/validators/noWhitespace.validator';

@Component({
  selector: 'app-claim-submit-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>Submit Claim</h2>

    <mat-dialog-content>
      <form [formGroup]="form">
        <div class="form-body">
          <mat-form-field appearance="outline">
            <mat-label>Title</mat-label>
            <input matInput formControlName="title" />
            @if (form.controls.title.hasError('required')) {
              <mat-error>Required</mat-error>
            }
            @if (form.controls.title.hasError('whitespace') && form.controls.title.touched) {
              <mat-error>Cannot be blank or spaces only</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="2"></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Claim type</mat-label>
            <mat-select formControlName="claimType">
              <mat-option value="medical">Medical</mat-option>
              <mat-option value="gym">Gym</mat-option>
              <mat-option value="transport">Transport</mat-option>
              <mat-option value="meal">Meal</mat-option>
              <mat-option value="other">Other</mat-option>
            </mat-select>
            @if (form.controls.claimType.hasError('required')) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Benefit package</mat-label>
            <mat-select formControlName="benefitPackageId">
              @for (pkg of packages(); track pkg.id) {
                <mat-option [value]="pkg.id">{{ pkg.name }}</mat-option>
              }
            </mat-select>
            @if (form.controls.benefitPackageId.hasError('required')) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Amount (€)</mat-label>
            <input matInput type="number" formControlName="amount" />
            @if (form.controls.amount.hasError('required')) {
              <mat-error>Required</mat-error>
            }
            @if (form.controls.amount.hasError('min')) {
              <mat-error>Amount must be greater than 0</mat-error>
            }
          </mat-form-field>

          @if (error()) {
            <p class="error-message">{{ error() }}</p>
          }
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button type="button" (click)="submit()" [disabled]="loading()">
        @if (loading()) {
          <mat-spinner diameter="20" />
        } @else {
          Submit
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 16px;
      }

      .form-body {
        margin-top: 6px;
      }

      mat-form-field {
        width: 100%;
      }
    `,
  ],
})
export class ClaimSubmitDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private claimsService = inject(ClaimsService);
  private packagesService = inject(BenefitPackagesService);
  private dialogRef = inject(MatDialogRef<ClaimSubmitDialogComponent>);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  packages = signal<BenefitPackage[]>([]);
  error = signal<string | null>(null);

  form = this.fb.group({
    title: ['', [Validators.required, noWhitespaceValidator]],
    description: [''],
    claimType: ['', Validators.required],
    benefitPackageId: [null as number | null, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  ngOnInit() {
    this.packagesService.getAll().subscribe({
      next: (data) => this.packages.set(data.items.filter((p) => p.isActive)),
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    const value = this.form.value;
    const payload = {
      title: value.title!,
      description: value.description ?? undefined,
      claimType: value.claimType!,
      benefitPackageId: Number(value.benefitPackageId),
      amount: Number(value.amount),
    };

    this.claimsService.create(payload).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.error.set(err.error?.message ?? 'Failed to submit claim');
        this.loading.set(false);
      },
    });
  }
}
