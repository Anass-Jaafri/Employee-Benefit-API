import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CompaniesService } from './companies.service';
import { Company } from '../../shared/models';
import { CompanyDialogComponent } from './company-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatPaginator,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    EmptyStateComponent,
  ],
  template: `
    <section class="page-header">
      <div>
        <h1 class="page-title">Companies</h1>
        <p class="page-subtitle">
          Manage organizations connected to your employee benefits platform.
        </p>
      </div>

      <button
        type="button"
        mat-flat-button
        color="primary"
        class="!rounded-xl"
        (click)="openDialog()"
      >
        <mat-icon>add</mat-icon>
        <span>New Company</span>
      </button>
    </section>

    <section class="grid gap-4 md:grid-cols-3">
      <div class="stat-card">
        <p class="stat-label">Total Companies</p>
        <p class="stat-value">{{ total() || companies().length }}</p>
        <p class="stat-meta">Connected organizations in the system</p>
      </div>

      <div class="stat-card">
        <p class="stat-label">Visible This Page</p>
        <p class="stat-value">{{ companies().length }}</p>
        <p class="stat-meta">Currently loaded records</p>
      </div>

      <div class="stat-card">
        <p class="stat-label">Average Employees</p>
        <p class="stat-value">{{ averageEmployees() }}</p>
        <p class="stat-meta">Approximate employee count per company</p>
      </div>
    </section>

    <section class="data-table-shell mt-6">
      @if (loading()) {
        <div class="flex items-center justify-center p-12">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (!companies().length) {
        <div class="p-10 text-center">
          <app-empty-state
            icon="business"
            title="No companies found"
            description="Start by creating your first company record."
            actionLabel="Create Company"
            (action)="openDialog()"
          />
          <button
            type="button"
            mat-flat-button
            color="primary"
            class="!mt-4 !rounded-xl"
            (click)="openDialog()"
          >
            <mat-icon>add</mat-icon>
            <span>Create Company</span>
          </button>
        </div>
      } @else {
        <div class="table-scroll">
          <table class="app-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Industry</th>
                <th>Employees</th>
                <th class="!text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              @for (company of companies(); track company.id) {
                <tr>
                  <td>
                    <div class="font-semibold text-slate-900 dark:text-white">
                      {{ company.name }}
                    </div>
                  </td>
                  <td>{{ company.industry || '—' }}</td>
                  <td>{{ company.employeeCount || 0 }}</td>
                  <td>
                    <div class="flex justify-end gap-2">
                      <button
                        mat-icon-button
                        type="button"
                        matTooltip="Edit company"
                        (click)="openDialog(company)"
                      >
                        <mat-icon>edit</mat-icon>
                      </button>

                      <button
                        mat-icon-button
                        type="button"
                        color="warn"
                        matTooltip="Delete company"
                        (click)="delete(company)"
                      >
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <mat-paginator
          [length]="total()"
          [pageSize]="limit()"
          [pageIndex]="page() - 1"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPageChange($event)"
        />
      }
    </section>
  `,
})
export class CompaniesComponent implements OnInit {
  private companiesService = inject(CompaniesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  companies = signal<Company[]>([]);
  loading = signal(true);
  page = signal(1);
  limit = signal(20);
  total = signal(0);

  ngOnInit() {
    this.load();
  }

  averageEmployees(): string {
    const list = this.companies();
    if (!list.length) return '0';
    const total = list.reduce((sum, c) => sum + (c.employeeCount || 0), 0);
    return Math.round(total / list.length).toString();
  }

  load() {
    this.loading.set(true);
    this.companiesService.getAll(this.page(), this.limit()).subscribe({
      next: (data) => {
        this.companies.set(data.items);
        if (data.meta) this.total.set(data.meta.total);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load companies', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: PageEvent) {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.load();
  }

  openDialog(company?: Company) {
    const dialogRef = this.dialog.open(CompanyDialogComponent, {
      width: '480px',
      data: company ?? null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.load();
    });
  }

  delete(company: Company) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '360px',
      data: { name: company.name },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.companiesService.delete(company.id).subscribe({
        next: () => {
          this.snackBar.open(`${company.name} deleted`, 'Close', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Failed to delete', 'Close', { duration: 3000 }),
      });
    });
  }
}
