import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CompaniesService } from './companies.service';
import { Company } from '../../shared/models';
import { CompanyDialogComponent } from './company-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { PageEvent, MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-companies',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatPaginator,
  ],
  template: `
    <div class="page-header">
      <h2 class="selection-title">Companies</h2>
      <button mat-flat-button (click)="openDialog()">
        <mat-icon>add</mat-icon>
        New Company
      </button>
    </div>
    @if (loading()) {
      <div class="spinner-container">
        <mat-spinner diameter="48" />
      </div>
    } @else {
      <table mat-table [dataSource]="companies()">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let company">{{ company.name }}</td>
        </ng-container>
        <ng-container matColumnDef="industry">
          <th mat-header-cell *matHeaderCellDef>Industry</th>
          <td mat-cell *matCellDef="let company">{{ company.industry }}</td>
        </ng-container>

        <ng-container matColumnDef="employeeCount">
          <th mat-header-cell *matHeaderCellDef>Employees</th>
          <td mat-cell *matCellDef="let company">{{ company.employeeCount }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let company">
            <button mat-icon-button matTooltip="Edit" (click)="openDialog(company)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Delete" color="warn" (click)="delete(company)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
      <mat-paginator
        [length]="total()"
        [pageSize]="limit()"
        [pageSizeOptions]="[10, 20, 50]"
        [pageIndex]="page() - 1"
        (page)="onPageChange($event)"
        showFirstLastButtons
      />
    }
  `,
  styles: [
    `
      .section-title {
        font-size: 22px;
        font-weight: 600;
        margin: 0 0 20px;
      }
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
    `,
  ],
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

  columns = ['name', 'industry', 'employeeCount', 'actions'];

  ngOnInit() {
    this.load();
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
