import { Component, inject, signal, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { BenefitPackage } from '../../shared/models';
import { BenefitPackagesService } from './benefit-packages.service';
import { BenefitPackageDialogComponent } from './benefit-package-dialog.component';

@Component({
    selector: 'app-benefit-packages',
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
    template: `
    <div class="page-header">
      <h2>Benefit Packages</h2>
      <button mat-flat-button (click)="openDialog()">
        <mat-icon>add</mat-icon>
        New Package
      </button>
    </div>

    @if (loading()) {
      <div class="spinner-container">
        <mat-spinner diameter="48" />
      </div>
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
            <button mat-icon-button matTooltip="Edit" (click)="openDialog(p)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Delete" color="warn" (click)="delete(p)">
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
    .perks-cell { display: flex; flex-wrap: wrap; gap: 4px; }
    .status-active { --mdc-chip-label-text-color: #2e7d32; background: #e8f5e9 !important; }
    .status-inactive { --mdc-chip-label-text-color: #c62828; background: #ffebee !important; }
  `],
})
export class BenefitPackagesComponent implements OnInit {
    private service = inject(BenefitPackagesService);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);

    packages = signal<BenefitPackage[]>([]);
    loading = signal(true);
    columns = ['name', 'company', 'maxBenefitAmount', 'perks', 'status', 'actions'];

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

    ngOnInit() { this.load(); }

    load() {
        this.loading.set(true);
        this.service.getAll().subscribe({
            next: (data) => { this.packages.set(data); this.loading.set(false); },
            error: () => { this.snackBar.open('Failed to load packages', 'Close', { duration: 3000 }); this.loading.set(false); },
        });
    }

    openDialog(pkg?: BenefitPackage) {
        const dialogRef = this.dialog.open(BenefitPackageDialogComponent, {
            width: '560px',
            data: pkg ?? null,
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) this.load();
        });
    }

    delete(pkg: BenefitPackage) {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '360px',
            data: { name: pkg.name },
        });
        dialogRef.afterClosed().subscribe(confirmed => {
            if (!confirmed) return;
            this.service.delete(pkg.id).subscribe({
                next: () => { this.snackBar.open('Package deleted', 'Close', { duration: 3000 }); this.load(); },
                error: () => this.snackBar.open('Failed to delete package', 'Close', { duration: 3000 }),
            });
        });
    }
}