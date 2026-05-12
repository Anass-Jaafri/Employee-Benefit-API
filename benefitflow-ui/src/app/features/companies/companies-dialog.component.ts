import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { signal } from '@angular/core';
import { CompaniesService } from '../../core/services/companies.service';
import { Company } from '../../shared/models';

@Component({
    selector: 'app-company-dialog',
    imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
    ],
    template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Company' : 'New Company' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" id="company-form" (ngSubmit)="submit()">

        <mat-form-field appearance="outline">
          <mat-label>Company name</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Industry</mat-label>
          <input matInput formControlName="industry" />
          @if (form.controls.industry.hasError('required')) {
            <mat-error>Industry is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Employee count</mat-label>
          <input matInput type="number" formControlName="employeeCount" />
          @if (form.controls.employeeCount.hasError('required')) {
            <mat-error>Employee count is required</mat-error>
          }
          @if (form.controls.employeeCount.hasError('min')) {
            <mat-error>Must be at least 1</mat-error>
          }
        </mat-form-field>

      </form>
    </mat-dialog-content>

   <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        type="submit"
        form="company-form"
        [disabled]="loading()">
        @if (loading()) {
          <mat-spinner diameter="20" />
        } @else {
          {{ isEdit ? 'Save' : 'Create' }}
        }
      </button>
    </mat-dialog-actions>
  `,
    styles: [`
    mat-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 8px;
    }
    mat-form-field {
      width: 100%;
    }
  `],
})
export class CompanyDialogComponent {
    private fb = inject(FormBuilder);
    private companiesService = inject(CompaniesService);
    private dialogRef = inject(MatDialogRef<CompanyDialogComponent>);
    private data: Company | null = inject(MAT_DIALOG_DATA);

    loading = signal(false);
    isEdit = !!this.data;

    form = this.fb.group({
        name: [this.data?.name ?? '', Validators.required],
        industry: [this.data?.industry ?? '', Validators.required],
        employeeCount: [this.data?.employeeCount ?? null, [Validators.required, Validators.min(1)]],
    });

    submit() {
        if (this.form.invalid) return;
        this.loading.set(true);

        const value = this.form.value;
        const payload = {
            name: value.name!,
            industry: value.industry!,
            employeeCount: Number(value.employeeCount),
        };

        const request$ = this.isEdit
            ? this.companiesService.update(this.data!.id, payload)
            : this.companiesService.create(payload);

        request$.subscribe({
            next: () => this.dialogRef.close(true),
            error: () => this.loading.set(false),
        });
    }
}