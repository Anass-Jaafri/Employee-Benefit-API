import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { StatCardComponent } from './stat-card.component';
import { CompaniesService } from '../../companies/companies.service';
import { EmployeesService } from '../../employees/employees.service';
import { BenefitPackagesService } from '../../benefit-packages/benefit-packages.service';
import { AuthService } from '../../../core/services/auth.service';
import { Company } from '../../../shared/models/company.model';
import { Employee } from '../../../shared/models/employee.model';
import { BenefitPackage } from '../../../shared/models/benefit-package.model';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-hr-dashboard',
  imports: [
    RouterLink, CurrencyPipe, StatCardComponent,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatChipsModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dashboard-wrapper">
 
      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="48" /></div>
      } @else {
 
        <h2 class="section-title">{{ myCompany()?.name ?? 'Your Company' }}</h2>
 
        <div class="stats-grid">
          <app-stat-card icon="people"          [value]="totalEmployees()"  label="Total Employees"  color="blue"   />
          <app-stat-card icon="person_check"    [value]="activeEmployees()" label="Active Employees" color="green"  />
          <app-stat-card icon="card_membership" [value]="totalPackages()"   label="Total Packages"   color="purple" />
          <app-stat-card icon="verified"        [value]="activePackages()"  label="Active Packages"  color="orange" />
        </div>
 
        <!-- Employees -->
        <mat-card class="section">
          <mat-card-header>
            <mat-card-title>Employees</mat-card-title>
            <span class="spacer"></span>
            <a mat-button color="primary" routerLink="/dashboard/employees">
              Manage <mat-icon>arrow_forward</mat-icon>
            </a>
          </mat-card-header>
 
          <mat-card-content>
            <div class="table-controls">
              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Status</mat-label>
                <mat-select [value]="employeeFilter()"
                            (selectionChange)="employeeFilter.set($event.value)">
                  <mat-option value="all">All</mat-option>
                  <mat-option value="active">Active</mat-option>
                  <mat-option value="inactive">Inactive</mat-option>
                  <mat-option value="on_leave">On Leave</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
 
            <table mat-table [dataSource]="filteredEmployees()" class="full-width">
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

 
              <tr mat-header-row *matHeaderRowDef="employeeColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: employeeColumns;"></tr>
              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data" [attr.colspan]="employeeColumns.length">No employees found</td>
              </tr>
            </table>
          </mat-card-content>
        </mat-card>
 
        <!-- Packages -->
        <mat-card class="section">
          <mat-card-header>
            <mat-card-title>Benefit Packages</mat-card-title>
            <span class="spacer"></span>
            <a mat-button color="primary" routerLink="/dashboard/benefit-packages">
              Manage <mat-icon>arrow_forward</mat-icon>
            </a>
          </mat-card-header>
 
          <mat-card-content>
            <table mat-table [dataSource]="packages()" class="full-width">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Package</th>
                <td mat-cell *matCellDef="let p">{{ p.name }}</td>
              </ng-container>
 
              <ng-container matColumnDef="maxAmount">
                <th mat-header-cell *matHeaderCellDef>Max Amount</th>
                <td mat-cell *matCellDef="let p">
                  {{ p.maxBenefitAmount ? (p.maxBenefitAmount | currency) : '—' }}
                </td>
              </ng-container>
 
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let p">
                  <mat-chip [class]="p.isActive ? 'status-active' : 'status-inactive'">
                    {{ p.isActive ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </td>
              </ng-container>
 
              <tr mat-header-row *matHeaderRowDef="packageColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: packageColumns;"></tr>
              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data" [attr.colspan]="packageColumns.length">No packages found</td>
              </tr>
            </table>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .dashboard-wrapper { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .loading-center    { display: flex; justify-content: center; padding: 80px; }
    .section-title     { font-size: 22px; font-weight: 600; margin: 0 0 20px; }
    .spacer            { flex: 1; }
    .section           { margin-bottom: 24px; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px; margin-bottom: 24px;
    }
    mat-card-header  { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
    .table-controls  { display: flex; gap: 16px; margin-bottom: 8px; }
    .filter-field    { width: 180px; }
    .full-width      { width: 100%; }
    .no-data         { padding: 24px; text-align: center; color: rgba(0,0,0,0.4); }
    .status-active   { --mdc-chip-label-text-color: #2e7d32; background: #e8f5e9 !important; }
    .status-inactive { --mdc-chip-label-text-color: #c62828; background: #ffebee !important; }
    .status-on_leave { --mdc-chip-label-text-color: #e65100; background: #fff3e0 !important; }
  `],
})
export class HrDashboardComponent implements OnInit {
  private employeesService = inject(EmployeesService);
  private packagesService = inject(BenefitPackagesService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  myCompany = signal<Company | null>(null);
  employees = signal<Employee[]>([]);
  packages = signal<BenefitPackage[]>([]);

  employeeFilter = signal<string>('all');

  // The logged-in HR manager's user id — used to disable the role selector on their own row
  readonly currentUserId = computed(() => this.authService.currentUser()?.id);

  readonly employeeColumns = ['name', 'email', 'jobTitle', 'status', 'role'];
  readonly packageColumns = ['name', 'maxAmount', 'status'];

  readonly totalEmployees = computed(() => this.employees().length);
  readonly activeEmployees = computed(() => this.employees().filter(e => e.status === 'active').length);
  readonly totalPackages = computed(() => this.packages().length);
  readonly activePackages = computed(() => this.packages().filter(p => p.isActive).length);

  readonly filteredEmployees = computed(() => {
    const filter = this.employeeFilter();
    if (filter === 'all') return this.employees();
    return this.employees().filter(e => e.status === filter);
  });

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Active', inactive: 'Inactive', on_leave: 'On Leave',
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
  ngOnInit(): void {
    forkJoin({
      company: this.employeesService.getMyCompany(),
      employees: this.employeesService.getMyEmployees(),
      packages: this.packagesService.getMyCompanyBenefit(),
    }).subscribe({
      next: ({ company, employees, packages }) => {
        this.myCompany.set(company);
        this.employees.set(employees);
        this.packages.set(packages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  togglePackage(pkg: BenefitPackage): void {
    const newState = !pkg.isActive;
    this.packages.update(list =>
      list.map(p => p.id === pkg.id ? { ...p, isActive: newState } : p)
    );
    this.packagesService.setActive(pkg.id, newState).subscribe({
      error: () =>
        this.packages.update(list =>
          list.map(p => p.id === pkg.id ? { ...p, isActive: !newState } : p)
        ),
    });
  }

}