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
  templateUrl: `./benefit-packages.component.html`,
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
