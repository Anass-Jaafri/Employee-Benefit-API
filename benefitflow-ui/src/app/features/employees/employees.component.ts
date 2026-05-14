import { Component, inject, signal, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { EmployeesService } from './employees.service';
import { EmployeeDialogComponent } from './employee-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

import { Employee } from '../../shared/models';

@Component({
    selector: 'app-employees',
    imports: [
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatChipsModule,
    ],
    template: `<div class="page-header">
        <h2>Employees</h2>
        <button mat-flat-button (click)="openDialog()">
            <mat-icon>add</mat-icon>
            New Employee
        </button>
    </div>
    
    @if (loading()) {
        <div class="spinner-container">
            <mat-spinner diameter="48"/>
        </div>
    } @else {
        <table mat-table [dataSource]="employees()">
            <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef = "let e">{{e.firstName}} {{e.lastName}}</td>
            </ng-container>
    <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let e">{{ e.email }}</td>
        </ng-container>

        <ng-container matColumnDef="jobTitle">
          <th mat-header-cell *matHeaderCellDef>Job Title</th>
          <td mat-cell *matCellDef="let e">{{ e.jobTitle ?? '—' }}</td>
        </ng-container>

        <ng-container matColumnDef="company">
          <th mat-header-cell *matHeaderCellDef>Company</th>
          <td mat-cell *matCellDef="let e">{{ e.company?.name ?? '—' }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let e">
            <mat-chip [class]="'status-' + e.status">
              {{ statusLabel(e.status) }}
            </mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let e">
            <button mat-icon-button matTooltip="Edit" (click)="openDialog(e)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Delete" color="warn" (click)="delete(e)">
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
    .page-header h2 { margin: 0; font-size: 24px; font-weight: 500; }
    table { width: 100%; }
    .spinner-container { display: flex; justify-content: center; padding: 48px; }
    .status-active { --mdc-chip-label-text-color: #2e7d32; background: #e8f5e9 !important; }
    .status-inactive { --mdc-chip-label-text-color: #c62828; background: #ffebee !important; }
    .status-on_leave { --mdc-chip-label-text-color: #e65100; background: #fff3e0 !important; }
  `],
})
export class EmployeesComponent implements OnInit {
    private employeesService = inject(EmployeesService);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);

    employees = signal<Employee[]>([]);
    loading = signal(true);
    columns = ['name', 'email', 'jobTitle', 'company', 'status', 'actions'];

    statusLabel(status: string): string {
        const labels: Record<string, string> = {
            active: 'Active',
            inactive: 'Inactive',
            on_leave: 'On Leave',
        }
        return labels[status] ?? status;
    }

    ngOnInit() {
        this.load();
    }

    load() {
        this.loading.set(true);
        this.employeesService.getAll().subscribe({
            next: (data) => { this.employees.set(data); this.loading.set(false); },
            error: () => { this.snackBar.open('Failed to load employees', 'Close', { duration: 3000 }); this.loading.set(false); },
        });
    }

    openDialog(employee?: Employee) {
        const dialogRef = this.dialog.open(EmployeeDialogComponent, {
            width: '520px',
            data: employee ?? null,
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) this.load();
        });
    }

    delete(employee: Employee) {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '360px',
            data: { name: `${employee.firstName} ${employee.lastName}` },
        });
        dialogRef.afterClosed().subscribe(confirmed => {
            if (!confirmed) return;
            this.employeesService.delete(employee.id).subscribe({
                next: () => { this.snackBar.open('Employee deleted', 'Close', { duration: 3000 }); this.load(); },
                error: () => this.snackBar.open('Failed to delete employee', 'Close', { duration: 3000 }),
            });
        });
    }
}