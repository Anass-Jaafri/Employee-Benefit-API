import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StatCardComponent } from './stat-card.component';
import { CompaniesService } from '../../companies/companies.service';
import { EmployeesService } from '../../employees/employees.service';
import { ClaimsService } from '../../claims/claims.service';
import { Company } from '../../../shared/models/company.model';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    RouterLink, StatCardComponent,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatChipsModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dashboard-wrapper">
 
      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="48" /></div>
      } @else {
 
        <h2 class="section-title">Overview</h2>
 
        <div class="stats-grid">
          <app-stat-card icon="business"        [value]="totalCompanies()"    label="Total Companies"  color="blue"   />
          <app-stat-card icon="check_circle"    [value]="activeCompanies()"   label="Active Companies" color="green"  />
          <app-stat-card icon="people"          [value]="employeeCount()"     label="Total Employees"  color="purple" />
          <app-stat-card icon="pending_actions" [value]="pendingClaimCount()" label="Pending Claims"   color="orange" />
        </div>
 
        <mat-card>
          <mat-card-header>
            <mat-card-title>Companies</mat-card-title>
            <span class="spacer"></span>
            <a mat-button color="primary" routerLink="/dashboard/companies">
              Manage <mat-icon>arrow_forward</mat-icon>
            </a>
          </mat-card-header>
 
          <mat-card-content>
            <div class="table-controls">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Search by name</mat-label>
                <mat-icon matPrefix>search</mat-icon>
                <input matInput (input)="companySearch.set($any($event.target).value)" />
              </mat-form-field>
 
              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Status</mat-label>
                <mat-select [value]="companyStatusFilter()"
                            (selectionChange)="companyStatusFilter.set($event.value)">
                  <mat-option value="all">All</mat-option>
                  <mat-option value="active">Active</mat-option>
                  <mat-option value="inactive">Inactive</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
 
            <table mat-table [dataSource]="filteredCompanies()" class="full-width">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Company</th>
                <td mat-cell *matCellDef="let c">{{ c.name }}</td>
              </ng-container>
 
              <ng-container matColumnDef="industry">
                <th mat-header-cell *matHeaderCellDef>Industry</th>
                <td mat-cell *matCellDef="let c">{{ c.industry }}</td>
              </ng-container>
 
              <ng-container matColumnDef="employeeCount">
                <th mat-header-cell *matHeaderCellDef>Employees</th>
                <td mat-cell *matCellDef="let c">{{ c.employeeCount }}</td>
              </ng-container>
 
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let c">
                  <mat-chip [class]="c.isActive ? 'status-active' : 'status-inactive'">
                    {{ c.isActive ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </td>
              </ng-container>
 
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data" [attr.colspan]="columns.length">
                  No companies match your filters
                </td>
              </tr>
            </table>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .dashboard-wrapper  { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .loading-center     { display: flex; justify-content: center; padding: 80px; }
    .section-title      { font-size: 22px; font-weight: 600; margin: 0 0 20px; }
    .spacer             { flex: 1; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px; margin-bottom: 24px;
    }
    mat-card-header     { display: flex; align-items: center; }
    .table-controls     { display: flex; gap: 16px; margin-bottom: 8px; flex-wrap: wrap; }
    .search-field       { flex: 1; min-width: 200px; }
    .filter-field       { width: 180px; }
    .full-width         { width: 100%; }
    .no-data            { padding: 24px; text-align: center; color: rgba(0,0,0,0.4); }
    .status-active   { --mdc-chip-label-text-color: #2e7d32; background: #e8f5e9 !important; }
    .status-inactive { --mdc-chip-label-text-color: #c62828; background: #ffebee !important; }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private companiesService = inject(CompaniesService);
  private employeesService = inject(EmployeesService);
  private claimsService = inject(ClaimsService);

  loading = signal(true);
  companies = signal<Company[]>([]);
  employeeCount = signal(0);
  pendingClaimCount = signal(0);

  companySearch = signal('');
  companyStatusFilter = signal<'all' | 'active' | 'inactive'>('all');

  readonly columns = ['name', 'industry', 'employeeCount', 'status'];

  readonly totalCompanies = computed(() => this.companies().length);
  readonly activeCompanies = computed(() => this.companies().filter(c => c.isActive).length);

  readonly filteredCompanies = computed(() => {
    let list = this.companies();
    const search = this.companySearch().toLowerCase().trim();
    const filter = this.companyStatusFilter();
    if (search) list = list.filter(c => c.name.toLowerCase().includes(search));
    if (filter === 'active') list = list.filter(c => c.isActive);
    if (filter === 'inactive') list = list.filter(c => !c.isActive);
    return list;
  });

  ngOnInit(): void {
    forkJoin({
      companies: this.companiesService.getAll(),
      employees: this.employeesService.getAll(),
      claims: this.claimsService.getAll(),
    }).subscribe({
      next: ({ companies, employees, claims }) => {
        this.companies.set(companies.items);
        this.employeeCount.set(employees.meta.total);
        this.pendingClaimCount.set(claims.items.filter(c => c.status === 'pending').length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleCompany(company: Company): void {
    const newState = !company.isActive;
    this.companies.update(list =>
      list.map(c => c.id === company.id ? { ...c, isActive: newState } : c)
    );
    this.companiesService.setActive(company.id, newState).subscribe({
      error: () =>
        this.companies.update(list =>
          list.map(c => c.id === company.id ? { ...c, isActive: !newState } : c)
        ),
    });
  }
}