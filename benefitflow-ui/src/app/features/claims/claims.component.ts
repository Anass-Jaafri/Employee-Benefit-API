import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { format } from 'date-fns';
import { Observable } from 'rxjs';

import { ClaimsService } from './claims.service';
import { AuthService } from '../../core/services/auth.service';
import { Claim } from '../../shared/models';
import { ClaimSubmitDialogComponent } from './claim-submit-dialog.component';
import { ClaimReviewDialogComponent } from './claim-review-dialog.component';

@Component({
  selector: 'app-claims',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatPaginator,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    @if (loading()) {
      <div class="spinner-container"><mat-spinner diameter="48" /></div>
    } @else {
      <div class="page-header">
        <h2>Claims</h2>
        @if (isEmployee()) {
          <button mat-flat-button (click)="openSubmitDialog()">
            <mat-icon>add</mat-icon>
            Submit Claim
          </button>
        }
      </div>

      <!-- Filters — shown for admin and HR manager -->
      @if (!isEmployee()) {
        <div class="filters-row" [formGroup]="filterForm">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="">All</mat-option>
              <mat-option value="pending">Pending</mat-option>
              <mat-option value="approved">Approved</mat-option>
              <mat-option value="rejected">Rejected</mat-option>
              <mat-option value="paid">Paid</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Type</mat-label>
            <mat-select formControlName="claimType">
              <mat-option value="">All</mat-option>
              <mat-option value="medical">Medical</mat-option>
              <mat-option value="gym">Gym</mat-option>
              <mat-option value="transport">Transport</mat-option>
              <mat-option value="meal">Meal</mat-option>
              <mat-option value="other">Other</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>From date</mat-label>
            <input matInput [matDatepicker]="fromPicker" formControlName="fromDate" />
            <mat-datepicker-toggle matSuffix [for]="fromPicker" />
            <mat-datepicker #fromPicker />
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>To date</mat-label>
            <input matInput [matDatepicker]="toPicker" formControlName="toDate" />
            <mat-datepicker-toggle matSuffix [for]="toPicker" />
            <mat-datepicker #toPicker />
          </mat-form-field>

          <button mat-stroked-button (click)="resetFilters()">
            <mat-icon>clear</mat-icon>
            Reset
          </button>
        </div>
      }

      <table mat-table [dataSource]="claims()">
        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef>Title</th>
          <td mat-cell *matCellDef="let c">{{ c.title }}</td>
        </ng-container>

        <ng-container matColumnDef="employee">
          <th mat-header-cell *matHeaderCellDef>Employee</th>
          <td mat-cell *matCellDef="let c">
            {{ c.employee?.firstName }} {{ c.employee?.lastName }}
          </td>
        </ng-container>

        <ng-container matColumnDef="package">
          <th mat-header-cell *matHeaderCellDef>Package</th>
          <td mat-cell *matCellDef="let c">{{ c.benefitPackage?.name }}</td>
        </ng-container>

        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef>Amount</th>
          <td mat-cell *matCellDef="let c">€{{ c.amount }}</td>
        </ng-container>

        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef>Type</th>
          <td mat-cell *matCellDef="let c">{{ typeLabel(c.claimType) }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let c">
            <mat-chip [class]="'status-' + c.status">{{ statusLabel(c.status) }}</mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Submitted</th>
          <td mat-cell *matCellDef="let c">{{ c.createdAt | date: 'dd/MM/yyyy' }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let c">
            @if (canReview() && c.status === 'pending') {
              <button mat-icon-button matTooltip="Review" (click)="openReviewDialog(c)">
                <mat-icon>rate_review</mat-icon>
              </button>
            }
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>

      @if (!isEmployee() && !isHrManager()) {
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
      table {
        width: 100%;
      }
      .spinner-container {
        display: flex;
        justify-content: center;
        padding: 48px;
      }
      .filters-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        margin-bottom: 16px;
      }
      .filter-field {
        width: 180px;
      }
      .status-pending {
        --mdc-chip-label-text-color: #e65100;
        background: #fff3e0 !important;
      }
      .status-approved {
        --mdc-chip-label-text-color: #2e7d32;
        background: #e8f5e9 !important;
      }
      .status-rejected {
        --mdc-chip-label-text-color: #c62828;
        background: #ffebee !important;
      }
      .status-paid {
        --mdc-chip-label-text-color: #1565c0;
        background: #e3f2fd !important;
      }
    `,
  ],
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

  columns = ['title', 'employee', 'package', 'amount', 'type', 'status', 'date', 'actions'];

  readonly isHrManager = computed(() => this.currentUser()?.role === 'hr_manager');
  readonly isEmployee = computed(() => this.currentUser()?.role === 'employee');
  readonly canReview = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'hr_manager';
  });

  filterForm = this.fb.group({
    status: [''],
    claimType: [''],
    fromDate: [null as Date | null],
    toDate: [null as Date | null],
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

  ngOnInit() {
    // Re-run load whenever any filter changes — reset to page 1
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
    if (v.fromDate) params['fromDate'] = format(v.fromDate as Date, 'yyyy-MM-dd');
    if (v.toDate) params['toDate'] = format(v.toDate as Date, 'yyyy-MM-dd');
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
    this.filterForm.reset({ status: '', claimType: '', fromDate: null, toDate: null });
  }

  onPageChange(event: PageEvent) {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.load();
  }

  openSubmitDialog() {
    const dialogRef = this.dialog.open(ClaimSubmitDialogComponent, { width: '520px' });
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
