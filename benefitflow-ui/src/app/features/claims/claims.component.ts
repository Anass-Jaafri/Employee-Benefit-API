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
  templateUrl: `./claims.component.html`,
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
