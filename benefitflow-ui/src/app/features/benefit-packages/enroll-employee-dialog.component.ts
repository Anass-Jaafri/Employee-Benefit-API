import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { BenefitPackagesService } from './benefit-packages.service';
import { EmployeesService } from '../employees/employees.service';
import { BenefitPackage, Employee } from '../../shared/models';

@Component({
    selector: 'app-enroll-employee-dialog',
    imports: [
        ReactiveFormsModule, MatDialogModule,
        MatFormFieldModule, MatSelectModule,
        MatButtonModule, MatProgressSpinnerModule,
    ],
    template: `
    <h2 mat-dialog-title>Enroll Employee</h2>
    <p class="pkg-name">Package: <strong>{{ pkg.name }}</strong></p>

    <mat-dialog-content>
      <form [formGroup]="form" id="enroll-form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Select employee</mat-label>
          <mat-select formControlName="employeeId">
            @for (e of employees(); track e.id) {
              <mat-option [value]="e.id">
                {{ e.firstName }} {{ e.lastName }} — {{ e.email }}
              </mat-option>
            }
          </mat-select>
          @if (form.controls.employeeId.hasError('required') && form.controls.employeeId.touched) {
            <mat-error>Please select an employee</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button type="submit" form="enroll-form" [disabled]="loading()">
        @if (loading()) {
          <mat-spinner diameter="20" />
        } @else {
          Enroll
        }
      </button>
    </mat-dialog-actions>
  `,
    styles: [`
    .pkg-name    { margin: 0 24px 8px; font-size: 14px; color: rgba(0,0,0,0.6); }
    .full-width  { width: 100%; }
    mat-dialog-content { padding-top: 8px; }
  `],
})
export class EnrollEmployeeDialogComponent implements OnInit {
    private fb = inject(FormBuilder);
    private packagesService = inject(BenefitPackagesService);
    private employeesService = inject(EmployeesService);
    private dialogRef = inject(MatDialogRef<EnrollEmployeeDialogComponent>);
    private snackBar = inject(MatSnackBar);

    pkg: BenefitPackage = inject(MAT_DIALOG_DATA);

    loading = signal(false);
    employees = signal<Employee[]>([]);

    form = this.fb.group({
        employeeId: [null as number | null, Validators.required],
    });

    ngOnInit() {
        // Load only employees in the HR's company
        this.employeesService.getMyEmployees().subscribe({
            next: (data) => this.employees.set(data),
            error: () => this.snackBar.open('Failed to load employees', 'Close', { duration: 3000 }),
        });
    }

    submit() {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }
        this.loading.set(true);

        const employeeId = this.form.value.employeeId!;

        this.packagesService.enrollEmployee(this.pkg.id, employeeId).subscribe({
            next: () => {
                this.snackBar.open('Employee enrolled successfully', 'Dismiss', { duration: 3000 });
                this.dialogRef.close(true);
            },
            error: (err) => {
                this.snackBar.open(
                    err.error?.message ?? 'Failed to enroll employee',
                    'Close',
                    { duration: 3000 },
                );
                this.loading.set(false);
            },
        });
    }
}