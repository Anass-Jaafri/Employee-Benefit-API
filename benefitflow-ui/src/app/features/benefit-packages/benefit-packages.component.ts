import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Observable } from 'rxjs';

import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { BenefitPackage } from '../../shared/models';
import { BenefitPackagesService } from './benefit-packages.service';
import { BenefitPackageDialogComponent } from './benefit-package-dialog.component';
import { EnrollEmployeeDialogComponent } from './enroll-employee-dialog.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-benefit-packages',
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginator,
  ],
  template: `
    <div class="page-header">
      <h2>Benefit Packages</h2>
      @if (!isEmployee()) {
        <button mat-flat-button (click)="openDialog()">
          <mat-icon>add</mat-icon>
          New Package
        </button>
      }
    </div>

    <!-- Filters — admin only (HR sees only their company's packages, already scoped) -->
    @if (!isEmployee() && !isHrManager()) {
      <div class="filters-row" [formGroup]="filterForm">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Status</mat-label>
          <mat-select formControlName="isActive">
            <mat-option value="">All</mat-option>
            <mat-option value="true">Active</mat-option>
            <mat-option value="false">Inactive</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-stroked-button (click)="resetFilters()">
          <mat-icon>clear</mat-icon>
          Reset
        </button>
      </div>
    }

    @if (loading()) {
      <div class="spinner-container"><mat-spinner diameter="48" /></div>
    } @else {
      <table mat-table [dataSource]="packages()">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let p">{{ p.name }}</td>
        </ng-container>

        <ng-container matColumnDef="company">
          <th mat-header-cell *matHeaderCellDef>Company</th>
          <td mat-cell *matCellDef="let p">{{ p.company?.name ?? '—' }}</td>
        </ng-container>

        <ng-container matColumnDef="maxBenefitAmount">
          <th mat-header-cell *matHeaderCellDef>Limit</th>
          <td mat-cell *matCellDef="let p">
            {{ p.maxBenefitAmount ? '€' + p.maxBenefitAmount : 'No limit' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="perks">
          <th mat-header-cell *matHeaderCellDef>Perks</th>
          <td mat-cell *matCellDef="let p">
            <div class="perks-cell">
              @for (perk of p.perks; track perk) {
                <mat-chip>{{ perkLabel(perk) }}</mat-chip>
              }
            </div>
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

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let p">
            @if (isHrManager()) {
              <button mat-icon-button matTooltip="Enroll employee" (click)="openEnrollDialog(p)">
                <mat-icon>person_add</mat-icon>
              </button>
            }
            @if (!isEmployee()) {
              <button mat-icon-button matTooltip="Edit" (click)="openDialog(p)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button matTooltip="Delete" color="warn" (click)="delete(p)">
                <mat-icon>delete</mat-icon>
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
      table {
        width: 100%;
      }
      .spinner-container {
        display: flex;
        justify-content: center;
        padding: 48px;
      }
      .perks-cell {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .status-active {
        --mdc-chip-label-text-color: #2e7d32;
        background: #e8f5e9 !important;
      }
      .status-inactive {
        --mdc-chip-label-text-color: #c62828;
        background: #ffebee !important;
      }
    `,
  ],
})
export class BenefitPackagesComponent implements OnInit {
  private authService = inject(AuthService);
  private benefitsService = inject(BenefitPackagesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  private currentUser = this.authService.currentUser;

  readonly isEmployee = computed(() => this.currentUser()?.role === 'employee');
  readonly isHrManager = computed(() => this.currentUser()?.role === 'hr_manager');

  packages = signal<BenefitPackage[]>([]);
  loading = signal(true);
  page = signal(1);
  limit = signal(20);
  total = signal(0);
  columns = ['name', 'company', 'maxBenefitAmount', 'perks', 'status', 'actions'];

  filterForm = this.fb.group({
    isActive: [''], // '' = all, 'true' = active, 'false' = inactive
  });

  readonly perkLabels: Record<string, string> = {
    health_insurance: 'Health Insurance',
    meal_voucher: 'Meal Voucher',
    gym_membership: 'Gym Membership',
    transport: 'Transport',
    remote_work: 'Remote Work',
  };

  perkLabel(perk: string): string {
    return this.perkLabels[perk] ?? perk;
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
    if (v.isActive !== '') params['isActive'] = v.isActive!;
    return params;
  }

  load() {
    this.loading.set(true);

    const request$: Observable<any> = this.isEmployee()
      ? this.benefitsService.getMyBenefit()
      : this.isHrManager()
        ? this.benefitsService.getMyCompanyBenefit()
        : this.benefitsService.getAll(this.page(), this.limit(), this.buildFilterParams());

    request$.subscribe({
      next: (data: any) => {
        this.packages.set(data.items ?? data);
        if (data.meta) this.total.set(data.meta.total);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load packages', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  resetFilters() {
    this.filterForm.reset({ isActive: '' });
  }

  onPageChange(event: PageEvent) {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.load();
  }

  openDialog(pkg?: BenefitPackage) {
    const dialogRef = this.dialog.open(BenefitPackageDialogComponent, {
      width: '560px',
      data: pkg ?? null,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.load();
    });
  }

  openEnrollDialog(pkg: BenefitPackage) {
    const dialogRef = this.dialog.open(EnrollEmployeeDialogComponent, {
      width: '480px',
      data: pkg,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.load();
    });
  }

  delete(pkg: BenefitPackage) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '360px',
      data: { name: pkg.name },
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.benefitsService.delete(pkg.id).subscribe({
        next: () => {
          this.snackBar.open('Package deleted', 'Close', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Failed to delete package', 'Close', { duration: 3000 }),
      });
    });
  }
}
