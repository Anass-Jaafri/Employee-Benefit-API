import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CompaniesService } from '../../core/services/companies.service';
import { Company } from '../../shared/models';
import { CompanyDialogComponent } from './companies-dialog.component';
import { ConfirmDialogComponent } from '../../shared/models/components/confirm-dialog.component';

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
  ],
  template: `<div class="page-header">
        <h2>Companies</h2>
        <button mat-flat-button (click)="openDialog()">
            <mat-icon>add</mat-icon>
            New Company
        </button>
    </div>
    @if (loading()) {
        <div class="spinner-container">
            <mat-spinner diameter="48"/>
        </div>
    } @else {
        <table mat-table [dataSource]="companies()">
            <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let company">{{company.name}}</td>
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
    }
  `,
  styles: [`
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
  `],
})

export class CompaniesComponent implements OnInit {

  private companiesService = inject(CompaniesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  companies = signal<Company[]>([]);
  loading = signal(true);

  columns = ['name', 'industry', 'employeeCount', 'actions'];

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.companiesService.getAll().subscribe({
      next: (data) => {
        this.companies.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load companies', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  openDialog(company?: Company) {
    const dialogRef = this.dialog.open(CompanyDialogComponent, {
      width: '480px',
      data: company ?? null,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.load();
    });
  }

  delete(company: Company) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '360px',
      data: { name: company.name },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
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