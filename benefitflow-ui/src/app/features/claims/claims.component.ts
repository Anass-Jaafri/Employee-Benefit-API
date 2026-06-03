import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { format } from 'date-fns';
import { Observable } from 'rxjs';
import { ClaimsService } from './claims.service';
import { AuthService } from '../../core/services/auth.service';
import { Claim } from '../../shared/models';
import { ClaimSubmitDialogComponent } from './claim-submit-dialog.component';
import { ClaimReviewDialogComponent } from './claim-review-dialog.component';

@Component({
  selector: 'app-claims',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
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
        <h1 class="page-title">Claims</h1>
        <p class="page-subtitle">
          Monitor submitted claims, review approvals, and track claim statuses.
        </p>
      </div>

      @if (isEmployee() || isHrManager()) {
        <button
          type="button"
          mat-flat-button
          color="primary"
          class="!rounded-xl"
          (click)="openSubmitDialog()"
        >
          <mat-icon>add</mat-icon>
          <span>Submit Claim</span>
        </button>
      }
    </section>

    <section class="grid gap-4 md:grid-cols-4">
      <div class="stat-card">
        <p class="stat-label">Claims</p>
        <p class="stat-value">{{ total() || claims().length }}</p>
        <p class="stat-meta">Tracked records</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Pending</p>
        <p class="stat-value">{{ countByStatus('pending') }}</p>
        <p class="stat-meta">Awaiting review</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Approved</p>
        <p class="stat-value">{{ countByStatus('approved') }}</p>
        <p class="stat-meta">Accepted submissions</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Paid</p>
        <p class="stat-value">{{ countByStatus('paid') }}</p>
        <p class="stat-meta">Completed payouts</p>
      </div>
    </section>

    @if (!isEmployee()) {
      <section class="content-card mt-6">
        <form [formGroup]="filterForm" class="grid gap-4 md:grid-cols-4">
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700 dark:text-white">
              Status
            </label>
            <select
              formControlName="status"
              class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-sky-900/30"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700 dark:text-white">
              Type
            </label>
            <select
              formControlName="claimType"
              class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-sky-900/30"
            >
              <option value="">All types</option>
              <option value="medical">Medical</option>
              <option value="gym">Gym</option>
              <option value="transport">Transport</option>
              <option value="meal">Meal</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700 dark:text-white">
              From date
            </label>
            <input
              formControlName="fromDate"
              type="date"
              class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-sky-900/30"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700 dark:text-white">
              To date
            </label>
            <input
              formControlName="toDate"
              type="date"
              class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-sky-900/30"
            />
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
      } @else if (!claims().length) {
        <div class="p-10 text-center">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">No claims found</h3>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
            There are no claims matching the current view.
          </p>
        </div>
      } @else {
        <div class="table-scroll">
          <table class="app-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Employee</th>
                <th>Package</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Status</th>
                <th>Submitted</th>
                <th class="!text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              @for (c of claims(); track c.id) {
                <tr>
                  <td>
                    <div class="font-semibold text-slate-900 dark:text-white">{{ c.title }}</div>
                  </td>
                  <td>{{ c.employee?.firstName }} {{ c.employee?.lastName }}</td>
                  <td>{{ c.benefitPackage?.name }}</td>
                  <td>€{{ c.amount }}</td>
                  <td>{{ typeLabel(c.claimType) }}</td>
                  <td>
                    <span
                      class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                      [class.bg-amber-100]="c.status === 'pending'"
                      [class.text-amber-700]="c.status === 'pending'"
                      [class.bg-emerald-100]="c.status === 'approved'"
                      [class.text-emerald-700]="c.status === 'approved'"
                      [class.bg-red-100]="c.status === 'rejected'"
                      [class.text-red-700]="c.status === 'rejected'"
                      [class.bg-sky-100]="c.status === 'paid'"
                      [class.text-sky-700]="c.status === 'paid'"
                    >
                      {{ statusLabel(c.status) }}
                    </span>
                  </td>
                  <td>{{ c.createdAt | date: 'dd/MM/yyyy' }}</td>
                  <td>
                    <div class="flex justify-end gap-2">
                      @if (canReview() && c.status === 'pending') {
                        <button
                          mat-icon-button
                          type="button"
                          matTooltip="Review claim"
                          (click)="openReviewDialog(c)"
                        >
                          <mat-icon>rate_review</mat-icon>
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
export class ClaimsComponent implements OnInit {
  private claimsService = inject(ClaimsService);
  private authService = inject(AuthService);
  private currentUser = this.authService.currentUser;
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  claims = signal<Claim[]>([]);
  loading = signal(true);
  page = signal(1);
  limit = signal(20);
  total = signal(0);

  readonly isHrManager = computed(() => this.currentUser()?.role === 'hr_manager');
  readonly isEmployee = computed(() => this.currentUser()?.role === 'employee');
  readonly canReview = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'hr_manager';
  });

  filterForm = this.fb.group({
    status: [''],
    claimType: [''],
    fromDate: [''],
    toDate: [''],
  });

  readonly statusLabels: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    paid: 'Paid',
  };

  readonly typeLabels: Record<string, string> = {
    medical: 'Medical',
    gym: 'Gym',
    transport: 'Transport',
    meal: 'Meal',
    other: 'Other',
  };

  statusLabel(status: string): string {
    return this.statusLabels[status] ?? status;
  }

  typeLabel(type: string): string {
    return this.typeLabels[type] ?? type;
  }

  countByStatus(status: string): number {
    return this.claims().filter((c) => c.status === status).length;
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
    if (v.status) params['status'] = v.status;
    if (v.claimType) params['claimType'] = v.claimType;
    if (v.fromDate) params['fromDate'] = format(new Date(v.fromDate), 'yyyy-MM-dd');
    if (v.toDate) params['toDate'] = format(new Date(v.toDate), 'yyyy-MM-dd');
    return params;
  }

  load() {
    this.loading.set(true);

    const filters = this.buildFilterParams();
    const request$: Observable<any> = this.isEmployee()
      ? this.claimsService.getMy()
      : this.isHrManager()
        ? this.claimsService.getMyCompany(filters)
        : this.claimsService.getAll(this.page(), this.limit(), filters);

    request$.subscribe({
      next: (data: any) => {
        this.claims.set(data.items ?? data);
        if (data.meta) this.total.set(data.meta.total);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load claims', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  resetFilters() {
    this.filterForm.reset({
      status: '',
      claimType: '',
      fromDate: '',
      toDate: '',
    });
  }

  onPageChange(event: PageEvent) {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.load();
  }

  openSubmitDialog() {
    const dialogRef = this.dialog.open(ClaimSubmitDialogComponent, {
      width: '520px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.load();
    });
  }

  openReviewDialog(claim: Claim) {
    const dialogRef = this.dialog.open(ClaimReviewDialogComponent, {
      width: '480px',
      data: claim,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.load();
    });
  }
}
