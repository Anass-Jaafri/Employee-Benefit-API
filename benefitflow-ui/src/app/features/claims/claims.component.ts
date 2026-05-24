import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClaimsService } from './claims.service';
import { AuthService } from '../../core/services/auth.service';
import { Claim } from '../../shared/models';
import { ClaimSubmitDialogComponent } from './claim-submit-dialog.component';
import { ClaimReviewDialogComponent } from './claim-review-dialog.component';

@Component({
  selector: 'app-claims',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    DatePipe,
  ],
  template: ` 
      @if (loading()) {
        <div class="spinner-container">
            <mat-spinner diameter = "48"/>
        </div>
    }
    @else if (isEmployee() || isHrManager()) {
          <div class="page-header">
        <h2>Claims</h2>
            <button mat-flat-button (click)="openSubmitDialog()">
                <mat-icon>add</mat-icon>
                Submit Claim
            </button>
          </div>
        <table mat-table [dataSource]="claims()">
            <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Title</th>
                <td mat-cell *matCellDef="let c">{{c.title}}</td>
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
            <mat-chip [class]="'status-' + c.status">
              {{ statusLabel(c.status) }}
            </mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Submitted</th>
          <td mat-cell *matCellDef="let c">{{ c.createdAt | date:'dd/MM/yyyy' }}</td>
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
    }
    `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .page-header h2 { margin: 0; font-size: 24px; font-weight: 500; }
    table { width: 100%; }
    .spinner-container { display: flex; justify-content: center; padding: 48px; }
    .status-pending  { --mdc-chip-label-text-color: #e65100; background: #fff3e0 !important; }
    .status-approved { --mdc-chip-label-text-color: #2e7d32; background: #e8f5e9 !important; }
    .status-rejected { --mdc-chip-label-text-color: #c62828; background: #ffebee !important; }
    .status-paid     { --mdc-chip-label-text-color: #1565c0; background: #e3f2fd !important; }
  `],
})
export class ClaimsComponent {
  private claimsService = inject(ClaimsService);
  private authService = inject(AuthService);
  private currentUser = this.authService.currentUser;
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  claims = signal<Claim[]>([]);
  myClaims = signal<Claim[]>([]);
  loading = signal(true);
  columns = ['title', 'employee', 'package', 'amount', 'type', 'status', 'date', 'actions'];

  readonly isHrManager = computed(() => this.currentUser()?.role === 'hr_manager');
  readonly isEmployee = computed(() => this.currentUser()?.role === 'employee');
  readonly canReview = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'admin' || role === 'hr_manager';
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
  }

  statusLabel(status: string): string { return this.statusLabels[status] ?? status; }
  typeLabel(type: string): string { return this.typeLabels[type] ?? type; }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.isEmployee() ? this.claimsService.getMy().subscribe({
      next: (data) => {
        this.claims.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load claims', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    }) : this.claimsService.getAll().subscribe({
      next: (data) => {
        this.claims.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load claims', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  openSubmitDialog() {
    const dialogRef = this.dialog.open(ClaimSubmitDialogComponent, { width: '520px' });
    dialogRef.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  openReviewDialog(claim: Claim) {
    const dialogRef = this.dialog.open(ClaimReviewDialogComponent, {
      width: '480px',
      data: claim,
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.load(); });
  }


}