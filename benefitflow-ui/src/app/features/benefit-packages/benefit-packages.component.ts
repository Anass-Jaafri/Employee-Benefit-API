import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { BenefitPackage } from '../../shared/models';
import { BenefitPackagesService } from './benefit-packages.service';
import { BenefitPackageDialogComponent } from './benefit-package-dialog.component';
import { EnrollEmployeeDialogComponent } from './enroll-employee-dialog.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-benefit-packages',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
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
        <h1 class="page-title">Benefit Packages</h1>
        <p class="page-subtitle">Manage benefit packages, enrollment access, and package status.</p>
      </div>

      @if (!isEmployee()) {
        <button
          type="button"
          mat-flat-button
          color="primary"
          class="!rounded-xl"
          (click)="openDialog()"
        >
          <mat-icon>add</mat-icon>
          <span>New Package</span>
        </button>
      }
    </section>

    <section class="grid gap-4 md:grid-cols-3">
      <div class="stat-card">
        <p class="stat-label">Packages</p>
        <p class="stat-value">{{ total() || packages().length }}</p>
        <p class="stat-meta">Benefit packages in the system</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Active</p>
        <p class="stat-value">{{ activeCount() }}</p>
        <p class="stat-meta">Packages currently available</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Inactive</p>
        <p class="stat-value">{{ inactiveCount() }}</p>
        <p class="stat-meta">Packages not currently offered</p>
      </div>
    </section>

    @if (!isEmployee() && !isHrManager()) {
      <section class="content-card mt-6">
        <form [formGroup]="filterForm" class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700 dark:text-white">
              Status
            </label>
            <select
              formControlName="isActive"
              class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-sky-900/30"
            >
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
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
    }

    <section class="data-table-shell mt-6">
      @if (loading()) {
        <div class="flex items-center justify-center p-12">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (!packages().length) {
        <div class="p-10 text-center">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
            No benefit packages found
          </h3>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Create a package or adjust your filters.
          </p>
        </div>
      } @else {
        <div class="table-scroll">
          <table class="app-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Limit</th>
                <th>Perks</th>
                <th>Status</th>
                <th class="!text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              @for (p of packages(); track p.id) {
                <tr>
                  <td>
                    <div class="font-semibold text-slate-900 dark:text-white">{{ p.name }}</div>
                  </td>
                  <td>{{ p.company.name ?? '—' }}</td>
                  <td>
                    @if (p.maxBenefitAmount) {
                      {{ p.maxBenefitAmount | currency: 'EUR' : 'symbol' : '1.0-0' }}
                    } @else {
                      No limit
                    }
                  </td>
                  <td>
                    <div class="flex flex-wrap gap-2">
                      @for (perk of p.perks; track perk) {
                        <span
                          class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {{ perkLabel(perk) }}
                        </span>
                      }
                    </div>
                  </td>
                  <td>
                    <span
                      class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                      [class.bg-emerald-100]="p.isActive"
                      [class.text-emerald-700]="p.isActive"
                      [class.bg-slate-100]="!p.isActive"
                      [class.text-slate-700]="!p.isActive"
                      [class.dark:bg-slate-800]="!p.isActive"
                      [class.dark:text-slate-200]="!p.isActive"
                    >
                      {{ p.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <div class="flex justify-end gap-2">
                      @if (isHrManager()) {
                        <button
                          mat-icon-button
                          type="button"
                          matTooltip="Enroll employee"
                          (click)="openEnrollDialog(p)"
                        >
                          <mat-icon>person_add</mat-icon>
                        </button>
                      }

                      @if (!isEmployee()) {
                        <button
                          mat-icon-button
                          type="button"
                          matTooltip="Edit package"
                          (click)="openDialog(p)"
                        >
                          <mat-icon>edit</mat-icon>
                        </button>

                        <button
                          mat-icon-button
                          type="button"
                          color="warn"
                          matTooltip="Delete package"
                          (click)="delete(p)"
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

        @if (!isEmployee() && !isHrManager()) {
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
export class BenefitPackagesComponent implements OnInit {
  private service = inject(BenefitPackagesService);
  private authService = inject(AuthService);
  private currentUser = this.authService.currentUser;
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  readonly isEmployee = computed(() => this.currentUser()?.role === 'employee');
  readonly isHrManager = computed(() => this.currentUser()?.role === 'hr_manager');

  packages = signal<BenefitPackage[]>([]);
  loading = signal(true);
  page = signal(1);
  limit = signal(20);
  total = signal(0);

  filterForm = this.fb.group({
    isActive: [''],
  });

  ngOnInit(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.page.set(1);
      this.load();
    });
    this.load();
  }

  perkLabel(value: string): string {
    const labels: Record<string, string> = {
      medical: 'Medical',
      gym: 'Gym',
      transport: 'Transport',
      meal: 'Meal',
      other: 'Other',
    };
    return labels[value] ?? value;
  }

  activeCount(): number {
    return this.packages().filter((p) => p.isActive).length;
  }

  inactiveCount(): number {
    return this.packages().filter((p) => !p.isActive).length;
  }

  private buildFilterParams(): Record<string, string> {
    const v = this.filterForm.value;
    const params: Record<string, string> = {};
    if (v.isActive !== null && v.isActive !== undefined && v.isActive !== '') {
      params['isActive'] = v.isActive;
    }
    return params;
  }

  load(): void {
    this.loading.set(true);

    const filters = this.buildFilterParams();

    const request$: Observable<any> = this.isEmployee()
      ? this.service.getMyBenefit()
      : this.isHrManager()
        ? this.service.getMyCompanyBenefit()
        : this.service.getAll(this.page(), this.limit(), filters);

    request$.subscribe({
      next: (data: any) => {
        this.packages.set(data.items ?? data);
        if (data.meta) this.total.set(data.meta.total);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load benefit packages', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  resetFilters(): void {
    this.filterForm.reset({ isActive: '' });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.load();
  }

  openDialog(data?: BenefitPackage): void {
    const dialogRef = this.dialog.open(BenefitPackageDialogComponent, {
      width: '520px',
      data: data ?? null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.load();
    });
  }

  openEnrollDialog(pkg: BenefitPackage): void {
    const dialogRef = this.dialog.open(EnrollEmployeeDialogComponent, {
      width: '520px',
      data: pkg,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.load();
    });
  }

  delete(pkg: BenefitPackage): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '360px',
      data: { name: pkg.name },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.service.delete(pkg.id).subscribe({
        next: () => {
          this.snackBar.open('Benefit package deleted', 'Close', { duration: 3000 });
          this.load();
        },
        error: () => {
          this.snackBar.open('Failed to delete benefit package', 'Close', { duration: 3000 });
        },
      });
    });
  }
}
