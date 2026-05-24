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

import { StatCardComponent } from './stat-card.component';
import { CompaniesService } from '../../companies/companies.service';
import { EmployeesService } from '../../employees/employees.service';
import { BenefitPackagesService } from '../../benefit-packages/benefit-packages.service';
import { Company } from '../../../shared/models/company.model';
import { Employee } from '../../../shared/models/employee.model';
import { BenefitPackage } from '../../../shared/models/benefit-package.model';

@Component({
    selector: 'app-hr-dashboard',
    imports: [
        RouterLink, CurrencyPipe, StatCardComponent,
        MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
        MatFormFieldModule, MatSelectModule, MatSlideToggleModule, MatProgressSpinnerModule,
    ],
    template: `
    <div class="dashboard-wrapper">

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="48" /></div>
      } @else {

        <h2 class="section-title">{{ myCompany()?.name ?? 'Your Company' }}</h2>

        <div class="stats-grid">
          <app-stat-card icon="people"       [value]="totalEmployees()"  label="Total Employees"  color="blue"   />
          <app-stat-card icon="person_check" [value]="activeEmployees()" label="Active Employees" color="green"  />
          <app-stat-card icon="card_membership" [value]="totalPackages()" label="Total Packages"  color="purple" />
          <app-stat-card icon="verified"     [value]="activePackages()"  label="Active Packages"  color="orange" />
        </div>

        <!-- Employees -->
        <mat-card class="section">
          <mat-card-header>
            <mat-card-title>Employees</mat-card-title>
            <span class="spacer"></span>
            <mat-form-field appearance="outline" class="inline-filter">
              <mat-label>Status</mat-label>
              <mat-select [value]="employeeFilter()"
                          (selectionChange)="employeeFilter.set($event.value)">
                <mat-option value="all">All</mat-option>
                <mat-option value="active">Active</mat-option>
                <mat-option value="inactive">Inactive</mat-option>
                <mat-option value="on_leave">On Leave</mat-option>
              </mat-select>
            </mat-form-field>
            <a mat-button color="primary" routerLink="/dashboard/employees">
              Manage <mat-icon>arrow_forward</mat-icon>
            </a>
          </mat-card-header>

          <mat-card-content>
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
                  <mat-select [value]="e.status"
                              (selectionChange)="updateEmployeeStatus(e.id, $event.value)"
                              class="status-select">
                    <mat-option value="active">Active</mat-option>
                    <mat-option value="inactive">Inactive</mat-option>
                    <mat-option value="on_leave">On Leave</mat-option>
                  </mat-select>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="employeeColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: employeeColumns;"></tr>
              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data" [attr.colspan]="employeeColumns.length">
                  No employees found
                </td>
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

              <ng-container matColumnDef="active">
                <th mat-header-cell *matHeaderCellDef>Active</th>
                <td mat-cell *matCellDef="let p">
                  <mat-slide-toggle [checked]="p.isActive"
                                    (change)="togglePackage(p)"
                                    color="primary" />
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="packageColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: packageColumns;"></tr>
              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data" [attr.colspan]="packageColumns.length">
                  No packages found
                </td>
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
    .inline-filter   { width: 150px; }
    .full-width      { width: 100%; }
    .status-select   { width: 130px; }
    .no-data         { padding: 24px; text-align: center; color: rgba(0,0,0,0.4); }
  `],
})
export class HrDashboardComponent implements OnInit {
    private companiesService = inject(CompaniesService);
    private employeesService = inject(EmployeesService);
    private packagesService = inject(BenefitPackagesService);

    loading = signal(true);
    myCompany = signal<Company | null>(null);
    employees = signal<Employee[]>([]);
    packages = signal<BenefitPackage[]>([]);

    employeeFilter = signal<string>('all');

    readonly employeeColumns = ['name', 'email', 'jobTitle', 'status'];
    readonly packageColumns = ['name', 'maxAmount', 'active'];

    readonly totalEmployees = computed(() => this.employees().length);
    readonly activeEmployees = computed(() => this.employees().filter(e => e.status === 'active').length);
    readonly totalPackages = computed(() => this.packages().length);
    readonly activePackages = computed(() => this.packages().filter(p => p.isActive).length);

    readonly filteredEmployees = computed(() => {
        const filter = this.employeeFilter();
        if (filter === 'all') return this.employees();
        return this.employees().filter(e => e.status === filter);
    });

    ngOnInit(): void {
        forkJoin({
            company: this.companiesService.getMy(),
            employees: this.employeesService.getMyCompany(),
            packages: this.packagesService.getMyCompany(),
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

    updateEmployeeStatus(employeeId: number, status: string): void {
        this.employeesService.updateStatus(employeeId, status).subscribe({
            next: () =>
                this.employees.update(list =>
                    list.map(e => e.id === employeeId ? { ...e, status: status as any } : e)
                ),
        });
    }
}