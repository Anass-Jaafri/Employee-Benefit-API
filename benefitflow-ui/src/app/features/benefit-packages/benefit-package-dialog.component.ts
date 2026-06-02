import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { format, parse } from 'date-fns';

import { BenefitPackagesService } from './benefit-packages.service';
import { CompaniesService } from '../companies/companies.service';
import { AuthService } from '../../core/services/auth.service';
import { BenefitPackage, Company } from '../../shared/models';
import { Observable } from 'rxjs';
import { noWhitespaceValidator } from '../../shared/validators/noWhitespace.validator';

@Component({
  selector: 'app-benefit-package-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Package' : 'New Package' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Package name</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>Required</mat-error>
          }
          @if (form.controls.name.hasError('whitespace') && form.controls.name.touched) {
            <mat-error>Cannot be blank or spaces only</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
          @if (
            form.controls.description.hasError('whitespace') && form.controls.description.touched
          ) {
            <mat-error>Cannot be blank or spaces only</mat-error>
          }
        </mat-form-field>

        <!-- Company selector — admin only. HR manager's company is resolved on the backend. -->
        @if (isAdmin()) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Company</mat-label>
            <mat-select formControlName="companyId">
              @for (company of companies(); track company.id) {
                <mat-option [value]="company.id">{{ company.name }}</mat-option>
              }
            </mat-select>
            @if (form.controls.companyId.hasError('required')) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Perks</mat-label>
          <mat-select formControlName="perks" multiple>
            @for (perk of availablePerks; track perk.value) {
              <mat-option [value]="perk.value">{{ perk.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Max benefit amount (€)</mat-label>
          <input matInput type="number" formControlName="maxBenefitAmount" />
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Start date</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate" />
            <mat-datepicker-toggle matSuffix [for]="startPicker" />
            <mat-datepicker #startPicker />
            @if (form.controls.startDate.hasError('matDatepickerParse')) {
              <mat-error>Invalid date</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>End date</mat-label>
            <input matInput [matDatepicker]="endPicker" formControlName="endDate" />
            <mat-datepicker-toggle matSuffix [for]="endPicker" />
            <mat-datepicker #endPicker />
            @if (form.controls.endDate.hasError('matDatepickerParse')) {
              <mat-error>Invalid date</mat-error>
            } @else if (form.controls.endDate.hasError('dateRange')) {
              <mat-error>End date must be after start date</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-checkbox formControlName="isActive">Active</mat-checkbox>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button type="button" (click)="submit()" [disabled]="loading()">
        @if (loading()) {
          <mat-spinner diameter="20" />
        } @else {
          {{ isEdit ? 'Save' : 'Create' }}
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 8px;
      }
      .full-width {
        width: 100%;
      }
      .row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .row mat-form-field {
        width: 100%;
      }
      mat-checkbox {
        margin-bottom: 8px;
      }
    `,
  ],
})
export class BenefitPackageDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(BenefitPackagesService);
  private companiesService = inject(CompaniesService);
  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<BenefitPackageDialogComponent>);
  private snackBar = inject(MatSnackBar);

  data: BenefitPackage | null = inject(MAT_DIALOG_DATA);

  loading = signal(false);
  companies = signal<Company[]>([]);
  isEdit = !!this.data;

  readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'admin');
  readonly isHrManager = computed(() => this.authService.currentUser()?.role === 'hr_manager');

  readonly availablePerks = [
    { value: 'health_insurance', label: 'Health Insurance' },
    { value: 'meal_voucher', label: 'Meal Voucher' },
    { value: 'gym_membership', label: 'Gym Membership' },
    { value: 'transport', label: 'Transport' },
    { value: 'remote_work', label: 'Remote Work' },
  ];

  form = this.fb.group({
    name: [this.data?.name ?? '', [Validators.required, noWhitespaceValidator]],
    description: [this.data?.description ?? '', [noWhitespaceValidator]],
    companyId: [this.data?.company?.id ?? (null as number | null)],
    perks: [this.data?.perks ?? []],
    maxBenefitAmount: [this.data?.maxBenefitAmount ?? (null as number | null)],
    startDate: [this.data?.startDate ? this.parseLocalDate(this.data.startDate) : null],
    endDate: [this.data?.endDate ? this.parseLocalDate(this.data.endDate) : null],
    isActive: [this.data?.isActive ?? true],
  });

  ngOnInit() {
    // Only load companies for admin — HR manager doesn't need the list
    if (this.isAdmin()) {
      this.form.controls.companyId.addValidators(Validators.required);
      this.form.controls.companyId.updateValueAndValidity();

      this.companiesService.getAll().subscribe({
        next: (data) => this.companies.set(data.items),
      });
    }

    this.form.controls.startDate.valueChanges.subscribe(() => this.validateDateRange());
    this.form.controls.endDate.valueChanges.subscribe(() => this.validateDateRange());
  }

  private parseLocalDate(dateStr: string): Date {
    return parse(dateStr, 'yyyy-MM-dd', new Date());
  }

  private validateDateRange(): void {
    const start = this.form.controls.startDate.value;
    const end = this.form.controls.endDate.value;
    const endControl = this.form.controls.endDate;

    if (start instanceof Date && end instanceof Date && end.getTime() <= start.getTime()) {
      endControl.setErrors({ ...endControl.errors, dateRange: true });
    } else {
      const errors = { ...endControl.errors };
      delete errors['dateRange'];
      endControl.setErrors(Object.keys(errors).length ? errors : null);
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);

    const value = this.form.getRawValue();

    const payload = {
      name: value.name!,
      description: value.description ?? undefined,
      perks: value.perks ?? [],
      maxBenefitAmount: value.maxBenefitAmount ? Number(value.maxBenefitAmount) : undefined,
      startDate: value.startDate ? this.formatDate(value.startDate as Date) : undefined,
      endDate: value.endDate ? this.formatDate(value.endDate as Date) : undefined,
      isActive: value.isActive ?? true,
    };

    let request$: Observable<any>;

    if (this.isEdit) {
      // Edit — same endpoint for both roles, backend validates ownership
      request$ = this.service.update(this.data!.id, payload);
    } else if (this.isAdmin()) {
      // Admin create — include companyId
      request$ = this.service.create({ ...payload, companyId: Number(value.companyId) });
    } else {
      // HR create — backend resolves company from JWT
      request$ = this.service.createForMyCompany(payload);
    }

    request$.subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.snackBar.open(err.error?.message ?? 'Something went wrong', 'Close', {
          duration: 3000,
        });
        this.loading.set(false);
      },
    });
  }

  private formatDate(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }
}
