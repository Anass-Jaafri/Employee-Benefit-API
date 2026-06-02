import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClaimsService } from './claims.service';
import { Claim } from '../../shared/models';
import { noWhitespaceValidator } from '../../shared/validators/noWhitespace.validator';

@Component({
  selector: 'app-claim-review-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Review Claim</h2>

    <mat-dialog-content>
      <div class="claim-summary">
        <p>
          <strong>{{ data.title }}</strong>
        </p>
        <p>Employee: {{ data.employee.firstName }} {{ data.employee.lastName }}</p>
        <p>Amount: €{{ data.amount }}</p>
        <p>Type: {{ data.claimType }}</p>
        @if (data.description) {
          <p>{{ data.description }}</p>
        }
      </div>

      <form [formGroup]="form">
        <mat-form-field appearance="outline">
          <mat-label>Decision</mat-label>
          <mat-select formControlName="status">
            <mat-option value="approved">Approve</mat-option>
            <mat-option value="rejected">Reject</mat-option>
            <mat-option value="paid">Mark as Paid</mat-option>
          </mat-select>
          @if (form.controls.status.hasError('required')) {
            <mat-error>Required</mat-error>
          }
        </mat-form-field>

        @if (form.controls.status.value === 'rejected') {
          <mat-form-field appearance="outline">
            <mat-label>Rejection reason</mat-label>
            <textarea matInput formControlName="rejectionReason" rows="3"></textarea>
            @if (form.controls.rejectionReason.hasError('required')) {
              <mat-error>Rejection reason is required</mat-error>
            }
            @if (
              form.controls.rejectionReason.hasError('whitespace') &&
              form.controls.rejectionReason.touched
            ) {
              <mat-error>Cannot be blank or spaces only</mat-error>
            }
          </mat-form-field>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button type="button" (click)="submit()" [disabled]="loading()">
        @if (loading()) {
          <mat-spinner diameter="20" />
        } @else {
          Confirm
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
        padding-top: 8px;
      }
      mat-form-field {
        width: 100%;
      }
      .claim-summary {
        background: var(--mat-sys-surface-variant);
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 16px;
      }
      .claim-summary p {
        margin: 4px 0;
        font-size: 14px;
      }
    `,
  ],
})
export class ClaimReviewDialogComponent {
  private fb = inject(FormBuilder);
  private claimsService = inject(ClaimsService);
  private dialogRef = inject(MatDialogRef<ClaimReviewDialogComponent>);
  readonly data: Claim = inject(MAT_DIALOG_DATA);

  loading = signal(false);

  form = this.fb.group({
    status: ['', Validators.required],
    rejectionReason: ['', noWhitespaceValidator],
  });

  submit() {
    const status = this.form.controls.status.value;

    if (status === 'rejected' && !this.form.controls.rejectionReason.value) {
      this.form.controls.rejectionReason.setErrors({ required: true });
      return;
    }

    if (this.form.invalid) return;
    this.loading.set(true);

    const payload = {
      status: status!,
      rejectionReason: this.form.controls.rejectionReason.value ?? undefined,
    };

    this.claimsService.review(this.data.id, payload).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.loading.set(false),
    });
  }
}
