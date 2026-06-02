import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StatCardComponent } from './stat-card.component';
import { ClaimsService } from '../../claims/claims.service';
import { BenefitPackagesService } from '../../benefit-packages/benefit-packages.service';
import { Claim } from '../../../shared/models/claim.model';
import { BenefitPackage } from '../../../shared/models/benefit-package.model';

@Component({
  selector: 'app-employee-dashboard',
  imports: [
    RouterLink, CurrencyPipe, TitleCasePipe, StatCardComponent,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatChipsModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dashboard-wrapper">

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="48" /></div>
      } @else {

        <h2 class="section-title">My Overview</h2>

        <div class="stats-grid">
          <app-stat-card icon="hourglass_top" [value]="counts().pending"  label="Pending Claims"  color="orange" />
          <app-stat-card icon="check_circle"  [value]="counts().approved" label="Approved Claims" color="green"  />
          <app-stat-card icon="payments"      [value]="counts().paid"     label="Paid Claims"     color="blue"   />
          <app-stat-card icon="cancel"        [value]="counts().rejected" label="Rejected Claims" color="red"    />
        </div>

        <!-- Enrolled packages -->
        <mat-card class="section">
          <mat-card-header>
            <mat-card-title>My Benefit Packages</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (packages().length === 0) {
              <p class="empty-state">You are not enrolled in any benefit packages yet.</p>
            } @else {
              <div class="packages-grid">
                @for (pkg of packages(); track pkg.id) {
                  <mat-card [class.inactive]="!pkg.isActive">
                    <mat-card-header>
                      <mat-card-title>{{ pkg.name }}</mat-card-title>
                      <mat-card-subtitle>{{ pkg.company.name }}</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      @if (pkg.maxBenefitAmount) {
                        <p class="package-amount">Up to {{ pkg.maxBenefitAmount | currency }}</p>
                      }
                      <div class="perks">
                        @for (perk of pkg.perks; track perk) {
                          <mat-chip>{{ perk | titlecase }}</mat-chip>
                        }
                      </div>
                    </mat-card-content>
                    <mat-card-footer class="pkg-footer">
                      <span [class]="pkg.isActive ? 'status-active' : 'status-inactive'">
                        ● {{ pkg.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </mat-card-footer>
                  </mat-card>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Claims -->
        <mat-card class="section">
          <mat-card-header>
            <mat-card-title>My Claims</mat-card-title>
            <span class="spacer"></span>
            <mat-form-field appearance="outline" class="inline-filter">
              <mat-label>Status</mat-label>
              <mat-select [value]="claimFilter()"
                          (selectionChange)="claimFilter.set($event.value)">
                <mat-option value="all">All</mat-option>
                <mat-option value="pending">Pending</mat-option>
                <mat-option value="approved">Approved</mat-option>
                <mat-option value="rejected">Rejected</mat-option>
                <mat-option value="paid">Paid</mat-option>
              </mat-select>
            </mat-form-field>
            <a mat-button color="primary" routerLink="/dashboard/claims">
              View all <mat-icon>arrow_forward</mat-icon>
            </a>
          </mat-card-header>

          <mat-card-content>
            <table mat-table [dataSource]="filteredClaims()" class="full-width">
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Title</th>
                <td mat-cell *matCellDef="let c">{{ c.title }}</td>
              </ng-container>

              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let c">{{ c.amount | currency }}</td>
              </ng-container>

              <ng-container matColumnDef="package">
                <th mat-header-cell *matHeaderCellDef>Package</th>
                <td mat-cell *matCellDef="let c">{{ c.benefitPackage?.name }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let c">
                  <span [class]="'status-chip status-' + c.status">
                    {{ c.status | titlecase }}
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="claimColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: claimColumns;"></tr>
              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data" [attr.colspan]="claimColumns.length">
                  No claims found
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
    .no-data         { padding: 24px; text-align: center; color: rgba(0,0,0,0.4); }
    .empty-state     { color: rgba(0,0,0,0.4); padding: 16px 0; text-align: center; }

    /* Packages grid */
    .packages-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
    }
    .inactive        { opacity: 0.6; }
    .package-amount  { font-size: 18px; font-weight: 600; color: #1976d2; margin: 8px 0; }
    .perks           { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .pkg-footer      { padding: 8px 16px; }
    .status-active   { color: #2e7d32; font-size: 13px; font-weight: 500; }
    .status-inactive { color: #c62828; font-size: 13px; font-weight: 500; }

    /* Claim status chips */
    .status-chip     { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .status-pending  { background: #fff8e1; color: #f57f17; }
    .status-approved { background: #e8f5e9; color: #2e7d32; }
    .status-rejected { background: #ffebee; color: #c62828; }
    .status-paid     { background: #e3f2fd; color: #1565c0; }
  `],
})
export class EmployeeDashboardComponent implements OnInit {
  private claimsService = inject(ClaimsService);
  private packagesService = inject(BenefitPackagesService);

  loading = signal(true);
  claims = signal<Claim[]>([]);
  packages = signal<BenefitPackage[]>([]);

  claimFilter = signal<string>('all');

  readonly claimColumns = ['title', 'amount', 'package', 'status'];

  readonly counts = computed(() => ({
    pending: this.claims().filter(c => c.status === 'pending').length,
    approved: this.claims().filter(c => c.status === 'approved').length,
    rejected: this.claims().filter(c => c.status === 'rejected').length,
    paid: this.claims().filter(c => c.status === 'paid').length,
  }));

  readonly filteredClaims = computed(() => {
    const filter = this.claimFilter();
    if (filter === 'all') return this.claims();
    return this.claims().filter(c => c.status === filter);
  });

  ngOnInit(): void {
    forkJoin({
      claims: this.claimsService.getMy(),
      packages: this.packagesService.getMyBenefit(),
    }).subscribe({
      next: ({ claims, packages }) => {
        this.claims.set(claims);
        this.packages.set(packages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}