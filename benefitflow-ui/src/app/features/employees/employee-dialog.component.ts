import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmployeesService } from './employees.service';
import { CompaniesService } from '../companies/companies.service';
import { Employee, Company } from '../../shared/models';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-employee-dialog',
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
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Employee' : 'New Employee' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" id="employee-form" (ngSubmit)="submit()">

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>First name</mat-label>
            <input matInput formControlName="firstName" />
            @if (form.controls.firstName.hasError('required')) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Last name</mat-label>
            <input matInput formControlName="lastName" />
            @if (form.controls.lastName.hasError('required')) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" />
          @if (form.controls.email.hasError('required')) {
            <mat-error>Required</mat-error>
          }
          @if (form.controls.email.hasError('email')) {
            <mat-error>Enter a valid email</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Job title</mat-label>
          <input matInput formControlName="jobTitle" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Company</mat-label>
          <mat-select formControlName="companyId">
            @for (company of companies(); track company.id) {
              <mat-option [value]="company.id">{{ company.name }}</mat-option>
            }
          </mat-select>
          @if (form.controls.companyId.hasError('required')) {
            <mat-error>Required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="active">Active</mat-option>
            <mat-option value="inactive">Inactive</mat-option>
            <mat-option value="on_leave">On Leave</mat-option>
          </mat-select>
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button type="submit" form ="employee-form" [disabled]="loading()">
        @if (loading()) {
          <mat-spinner diameter="20" />
        } @else {
          {{ isEdit ? 'Save' : 'Create' }}
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { display: flex; flex-direction: column; gap: 8px; padding-top: 8px; }
    mat-form-field { width: 100%; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  `],
})
export class EmployeeDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeesService = inject(EmployeesService);
  private companiesService = inject(CompaniesService);
  private dialogRef = inject(MatDialogRef<EmployeeDialogComponent>);
  private data: Employee | null = inject(MAT_DIALOG_DATA);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  companies = signal<Company[]>([]);
  isEdit = !!this.data;

  form = this.fb.group({
    firstName: [this.data?.firstName ?? '', Validators.required],
    lastName: [this.data?.lastName ?? '', Validators.required],
    email: [this.data?.email ?? '', [Validators.required, Validators.email]],
    jobTitle: [this.data?.jobTitle ?? ''],
    companyId: [this.data?.company?.id ?? null, Validators.required],
    status: [this.data?.status ?? 'active'],
  });

  ngOnInit() {
    this.companiesService.getAll().subscribe({
      next: (data) => this.companies.set(data),
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);

    const value = this.form.value;
    const payload = {
      firstName: value.firstName!,
      lastName: value.lastName!,
      email: value.email!,
      jobTitle: value.jobTitle ?? undefined,
      companyId: Number(value.companyId),
      status: value.status ?? undefined,
    };

    const request$ = this.isEdit
      ? this.employeesService.update(this.data!.id, payload)
      : this.employeesService.create(payload);

    request$.subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.snackBar.open(
          err.error?.message ?? 'Something went wrong',
          'Close',
          { duration: 3000 }
        );
        this.loading.set(false);
      },
    });
  }
}