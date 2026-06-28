import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { switchMap, of } from 'rxjs';

import { EmployeesService } from './employees.service';
import { CompaniesService } from '../companies/companies.service';
import { AuthService } from '../../core/services/auth.service';
import { Employee, Company } from '../../shared/models';
import { UserRole } from '../../shared/models/user.model';
import { noWhitespaceValidator } from '../../shared/validators/noWhitespace.validator';

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
  templateUrl: `./employees.component.html`,
  styleUrls: [`./employees.component.scss`],
})
export class EmployeeDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeesService = inject(EmployeesService);
  private companiesService = inject(CompaniesService);
  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<EmployeeDialogComponent>);
  private snackBar = inject(MatSnackBar);

  // Public so the template can access data?.user
  data: Employee | null = inject(MAT_DIALOG_DATA);

  loading = signal(false);
  companies = signal<Company[]>([]);
  isEdit = !!this.data;

  readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'admin');
  readonly isHrManager = computed(() => this.authService.currentUser()?.role === 'hr_manager');
  form = this.fb.group({
    firstName: [this.data?.firstName ?? '', [Validators.required, noWhitespaceValidator]],
    lastName: [this.data?.lastName ?? '', [Validators.required, noWhitespaceValidator]],
    email: [this.data?.email ?? '', [Validators.required, Validators.email, noWhitespaceValidator]],
    jobTitle: [this.data?.jobTitle ?? '', noWhitespaceValidator],
    companyId: [this.data?.company?.id ?? (null as number | null), Validators.required],
    status: [this.data?.status ?? 'active'],
    // Role is only used when editing — initialised from the linked user.
    role: [this.data?.user?.role ?? (null as UserRole | null)],
  });

  ngOnInit() {
    this.companiesService.getAll().subscribe({
      next: (data) => this.companies.set(data.items),
    });

    // HR manager: lock companyId to their own company — they can't reassign.
    if (this.isHrManager()) {
      this.form.controls.companyId.disable();
    }

    const currentUserId = this.authService.currentUser()?.id;
    if (this.isEdit && this.data?.user?.id === currentUserId) {
      this.form.controls.role.disable();
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);

    const value = this.form.getRawValue(); // getRawValue includes disabled controls

    const employeePayload = {
      firstName: value.firstName!,
      lastName: value.lastName!,
      email: value.email!,
      jobTitle: value.jobTitle || undefined,
      companyId: Number(value.companyId),
      status: value.status ?? undefined,
    };

    const employeeRequest$ = this.isEdit
      ? this.employeesService.update(this.data!.id, employeePayload)
      : this.employeesService.create(employeePayload);

    employeeRequest$
      .pipe(
        switchMap(() => {
          // Only fire the role update when:
          //   - editing an existing employee
          //   - the employee has a linked user
          //   - the role actually changed
          const newRole = value.role as UserRole | null;
          const currentRole = this.data?.user?.role;
          const userId = this.data?.user?.id;

          if (!this.isEdit || !userId || !newRole || newRole === currentRole) {
            return of(null); // nothing to do
          }

          return this.isAdmin()
            ? this.employeesService.updateUserRole(userId, newRole) // admin → /users/:id/role
            : this.employeesService.updateRole(this.data!.id, newRole as 'employee' | 'hr_manager'); // HR → /employees/:id/role
        }),
      )
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          this.snackBar.open(err.error?.message ?? 'Something went wrong', 'Close', {
            duration: 3000,
          });
          this.loading.set(false);
        },
      });
  }
}
