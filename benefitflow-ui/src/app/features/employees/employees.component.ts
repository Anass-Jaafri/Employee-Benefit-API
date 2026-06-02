import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

import { EmployeesService } from './employees.service';
import { EmployeeDialogComponent } from './employee-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { Employee } from '../../shared/models';
import { UserRole } from '../../shared/models/user.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-employees',
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginator,
  ],
  template: `
    <div class="page-header">
      <h2>Employees</h2>
      <button mat-flat-button (click)="openDialog()">
        <mat-icon>add</mat-icon>
        New Employee
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-row" [formGroup]="filterForm">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search by name or email</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput formControlName="search" />
      </mat-form-field>

      @if (isAdmin()) {
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="">All</mat-option>
            <mat-option value="active">Active</mat-option>
            <mat-option value="inactive">Inactive</mat-option>
            <mat-option value="on_leave">On Leave</mat-option>
          </mat-select>
        </mat-form-field>
      }

      <button mat-stroked-button (click)="resetFilters()">
        <mat-icon>clear</mat-icon>
        Reset
      </button>
    </div>

    @if (loading()) {
      <div class="spinner-container"><mat-spinner diameter="48" /></div>
    } @else {
      <table mat-table [dataSource]="employees()">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let e">{{ e.firstName }} {{ e.lastName }}</td>
        </ng-container>

        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let e">{{ e.email }}</td>
        </ng-container>

        <ng-container matColumnDef="jobTitle">
          <th mat-header-cell *matHeaderCellDef>Job Title</th>
          <td mat-cell *matCellDef="let e">{{ e.jobTitle ?? '—' }}</td>
        </ng-container>

        <ng-container matColumnDef="company">
          <th mat-header-cell *matHeaderCellDef>Company</th>
          <td mat-cell *matCellDef="let e">{{ e.company?.name ?? '—' }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let e">
            <mat-chip [class]="'status-' + e.status">{{ statusLabel(e.status) }}</mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="role">
          <th mat-header-cell *matHeaderCellDef>Role</th>
          <td mat-cell *matCellDef="let e">{{ roleLabel(e.user?.role) }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let e">
            <button mat-icon-button matTooltip="Edit" (click)="openDialog(e)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Delete" color="warn" (click)="delete(e)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>

      @if (isAdmin()) {
        <mat-paginator
          [length]="total()"
          [pageSize]="limit()"
          [pageSizeOptions]="[10, 20, 50]"
          [pageIndex]="page() - 1"
          (page)="onPageChange($event)"
          showFirstLastButtons
        />
      }
    }
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }
      .page-header h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 500;
      }
      .filters-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        margin-bottom: 16px;
      }
      .search-field {
        flex: 1;
        min-width: 240px;
      }
      .filter-field {
        width: 180px;
      }
      table {
        width: 100%;
      }
      .spinner-container {
        display: flex;
        justify-content: center;
        padding: 48px;
      }
      .status-active {
        --mdc-chip-label-text-color: #2e7d32;
        background: #e8f5e9 !important;
      }
      .status-inactive {
        --mdc-chip-label-text-color: #c62828;
        background: #ffebee !important;
      }
      .status-on_leave {
        --mdc-chip-label-text-color: #e65100;
        background: #fff3e0 !important;
      }
    `,
  ],
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
  columns = ['name', 'email', 'jobTitle', 'company', 'status', 'role', 'actions'];

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

  ngOnInit() {
    // Debounce not needed for select; for search input it would help
    // but valueChanges keeps it simple and consistent with claims
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
