import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EmployeesService } from './employees.service';
import { EmployeeDialogComponent } from './employee-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { Employee } from '../../shared/models';
import { UserRole } from '../../shared/models/user.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatPaginator,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
    <section class="page-header">
      <div>
        <h1 class="page-title">Employees</h1>
        <p class="page-subtitle">
          View, filter, edit, and manage employee records across companies.
        </p>
      </div>

      @if (isAdmin() || isHrManager()) {
        <button
          type="button"
          mat-flat-button
          color="primary"
          class="!rounded-xl"
          (click)="openDialog()"
        >
          <mat-icon>add</mat-icon>
          <span>New Employee</span>
        </button>
      }
    </section>

    <section class="grid gap-4 md:grid-cols-3">
      <div class="stat-card">
        <p class="stat-label">Employees</p>
        <p class="stat-value">{{ total() || employees().length }}</p>
        <p class="stat-meta">Tracked records in your workspace</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Active</p>
        <p class="stat-value">{{ countByStatus('active') }}</p>
        <p class="stat-meta">Currently active employees</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">On Leave</p>
        <p class="stat-value">{{ countByStatus('on_leave') }}</p>
        <p class="stat-meta">Employees temporarily unavailable</p>
      </div>
    </section>

    <section class="content-card mt-6">
      <form [formGroup]="filterForm" class="grid gap-4 md:grid-cols-3">
        <div class="md:col-span-2">
          <label class="mb-2 block text-sm font-semibold text-slate-700 dark:text-white">
            Search
          </label>
          <input
            formControlName="search"
            type="text"
            placeholder="Search by name or email"
            class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:ring-sky-900/30"
          />
        </div>

        @if (isAdmin()) {
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700 dark:text-white">
              Status
            </label>
            <select
              formControlName="status"
              class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-sky-900/30"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
        }
      </form>

      <div class="mt-4 flex justify-end">
        <button
          mat-stroked-button
          type="button"
          class="!rounded-xl dark:!border-slate-700 dark:!text-slate-200"
          (click)="resetFilters()"
        >
          Reset Filters
        </button>
      </div>
    </section>

    <section class="data-table-shell mt-6">
      @if (loading()) {
        <div class="flex items-center justify-center p-12">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (!employees().length) {
        <div class="p-10 text-center">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">No employees found</h3>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Try adjusting filters or create a new employee record.
          </p>
        </div>
      } @else {
        <div class="table-scroll">
          <table class="app-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Job Title</th>
                <th>Company</th>
                <th>Status</th>
                <th>Role</th>
                <th class="!text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              @for (e of employees(); track e.id) {
                <tr>
                  <td>
                    <div class="font-semibold text-slate-900 dark:text-white">
                      {{ e.firstName }} {{ e.lastName }}
                    </div>
                  </td>
                  <td>{{ e.email }}</td>
                  <td>{{ e.jobTitle ?? '—' }}</td>
                  <td>{{ e.company?.name ?? '—' }}</td>
                  <td>
                    <span
                      class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                      [class.bg-emerald-100]="e.status === 'active'"
                      [class.text-emerald-700]="e.status === 'active'"
                      [class.bg-red-100]="e.status === 'inactive'"
                      [class.text-red-700]="e.status === 'inactive'"
                      [class.bg-amber-100]="e.status === 'on_leave'"
                      [class.text-amber-700]="e.status === 'on_leave'"
                    >
                      {{ statusLabel(e.status) }}
                    </span>
                  </td>
                  <td>
                    <span>{{ roleLabel(e.user?.role) }}</span>
                  </td>
                  <td>
                    <div class="flex justify-end gap-2">
                      <button
                        mat-icon-button
                        type="button"
                        matTooltip="Edit employee"
                        (click)="openDialog(e)"
                      >
                        <mat-icon>edit</mat-icon>
                      </button>

                      @if (isAdmin() || isHrManager()) {
                        <button
                          mat-icon-button
                          type="button"
                          color="warn"
                          matTooltip="Delete employee"
                          (click)="delete(e)"
                        >
                          <mat-icon>delete</mat-icon>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (isAdmin()) {
          <mat-paginator
            [length]="total()"
            [pageSize]="limit()"
            [pageIndex]="page() - 1"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPageChange($event)"
          />
        }
      }
    </section>
  `,
})
export class EmployeesComponent implements OnInit {
  private authService = inject(AuthService);
  private currentUser = this.authService.currentUser;
  private employeesService = inject(EmployeesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly isHrManager = computed(() => this.currentUser()?.role === 'hr_manager');

  page = signal(1);
  limit = signal(20);
  total = signal(0);
  employees = signal<Employee[]>([]);
  loading = signal(true);

  filterForm = this.fb.group({
    search: [''],
    status: [''],
  });

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Active',
      inactive: 'Inactive',
      on_leave: 'On Leave',
    };
    return labels[status] ?? status;
  }

  roleLabel(role?: string): string {
    const labels: Record<string, string> = {
      admin: 'Admin',
      hr_manager: 'HR Manager',
      employee: 'Employee',
    };
    return role ? (labels[role] ?? role) : '—';
  }

  countByStatus(status: string): number {
    return this.employees().filter((e) => e.status === status).length;
  }

  ngOnInit() {
    this.filterForm.valueChanges.subscribe(() => {
      this.page.set(1);
      this.load();
    });
    this.load();
  }

  private buildFilterParams(): Record<string, string> {
    const v = this.filterForm.value;
    const params: Record<string, string> = {};
    if (v.search?.trim()) params['search'] = v.search.trim();
    if (v.status) params['status'] = v.status;
    return params;
  }

  load() {
    this.loading.set(true);

    if (this.isHrManager()) {
      this.employeesService.getMyEmployees().subscribe({
        next: (data) => {
          this.employees.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.snackBar.open('Failed to load employees', 'Close', { duration: 3000 });
          this.loading.set(false);
        },
      });
    } else if (this.isAdmin()) {
      const filters = this.buildFilterParams();
      this.employeesService.getAll(this.page(), this.limit(), filters).subscribe({
        next: ({ items, meta }) => {
          this.employees.set(items);
          this.total.set(meta.total);
          this.loading.set(false);
        },
        error: () => {
          this.snackBar.open('Failed to load employees', 'Close', { duration: 3000 });
          this.loading.set(false);
        },
      });
    }
  }

  resetFilters() {
    this.filterForm.reset({ search: '', status: '' });
  }

  onPageChange(event: PageEvent) {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.load();
  }

  updateRole(employee: Employee, role: UserRole): void {
    if (!employee.user) return;

    const previousRole = employee.user.role;

    this.employees.update((list) =>
      list.map((e) => (e.id === employee.id ? { ...e, user: { ...e.user!, role } } : e)),
    );

    this.employeesService.updateUserRole(employee.user.id, role).subscribe({
      next: () => this.snackBar.open(`Role updated to ${role}`, 'Dismiss', { duration: 3000 }),
      error: () => {
        this.employees.update((list) =>
          list.map((e) =>
            e.id === employee.id ? { ...e, user: { ...e.user!, role: previousRole } } : e,
          ),
        );
        this.snackBar.open('Failed to update role', 'Dismiss', { duration: 3000 });
      },
    });
  }

  openDialog(employee?: Employee) {
    const dialogRef = this.dialog.open(EmployeeDialogComponent, {
      width: '520px',
      data: employee ?? null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.load();
    });
  }

  delete(employee: Employee) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '360px',
      data: { name: `${employee.firstName} ${employee.lastName}` },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.employeesService.delete(employee.id).subscribe({
        next: () => {
          this.snackBar.open('Employee deleted', 'Close', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Failed to delete employee', 'Close', { duration: 3000 }),
      });
    });
  }
}
