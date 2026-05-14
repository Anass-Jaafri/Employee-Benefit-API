import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { format, parse } from 'date-fns';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BenefitPackage, Company } from '../../shared/models';
import { BenefitPackagesService } from './benefit-packages.service';
import { CompaniesService } from '../companies/companies.service';

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
        MatButtonModule,
        MatProgressSpinnerModule,
    ],
    template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Package' : 'New Package' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form">

        <mat-form-field appearance="outline">
          <mat-label>Package name</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>Required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
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

        <mat-form-field appearance="outline">
          <mat-label>Perks</mat-label>
          <mat-select formControlName="perks" multiple>
            @for (perk of availablePerks; track perk.value) {
              <mat-option [value]="perk.value">{{ perk.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
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
    <mat-error>Invalid date — use DD/MM/YYYY</mat-error>
  }
          </mat-form-field>

          <mat-form-field appearance="outline">
  <mat-label>End date</mat-label>
  <input matInput [matDatepicker]="endPicker" formControlName="endDate" />
  <mat-datepicker-toggle matSuffix [for]="endPicker" />
  <mat-datepicker #endPicker />
  @if (form.controls.endDate.hasError('matDatepickerParse')) {
    <mat-error>Invalid date — use DD/MM/YYYY</mat-error>
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
    styles: [`
    mat-dialog-content { display: flex; flex-direction: column; gap: 8px; padding-top: 8px; }
    mat-form-field { width: 100%; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    mat-checkbox { margin-bottom: 8px; }
  `],
})
export class BenefitPackageDialogComponent implements OnInit {
    private fb = inject(FormBuilder);
    private service = inject(BenefitPackagesService);
    private companiesService = inject(CompaniesService);
    private dialogRef = inject(MatDialogRef<BenefitPackageDialogComponent>);
    private data: BenefitPackage | null = inject(MAT_DIALOG_DATA);

    loading = signal(false);
    companies = signal<Company[]>([]);
    isEdit = !!this.data;

    readonly availablePerks = [
        { value: 'health_insurance', label: 'Health Insurance' },
        { value: 'meal_voucher', label: 'Meal Voucher' },
        { value: 'gym_membership', label: 'Gym Membership' },
        { value: 'transport', label: 'Transport' },
        { value: 'remote_work', label: 'Remote Work' },
    ];

    form = this.fb.group({
        name: [this.data?.name ?? '', Validators.required],
        description: [this.data?.description ?? ''],
        companyId: [this.data?.company?.id ?? null, Validators.required],
        perks: [this.data?.perks ?? []],
        maxBenefitAmount: [this.data?.maxBenefitAmount ?? null],
        startDate: [this.data?.startDate ? this.parseLocalDate(this.data.startDate) : null],
        endDate: [this.data?.endDate ? this.parseLocalDate(this.data.endDate) : null],
        isActive: [this.data?.isActive ?? true],
    });

    private parseLocalDate(dateStr: string): Date {
        return parse(dateStr, 'yyyy-MM-dd', new Date()); // local date — no UTC shift
    }

    ngOnInit() {
        this.companiesService.getAll().subscribe({
            next: (data) => this.companies.set(data),
        });

        // cross-field date validation
        this.form.controls.startDate.valueChanges.subscribe(() => this.validateDateRange());
        this.form.controls.endDate.valueChanges.subscribe(() => this.validateDateRange());
    }

    private validateDateRange(): void {
        const start = this.form.controls.startDate.value;
        const end = this.form.controls.endDate.value;
        const endControl = this.form.controls.endDate;

        if (
            start instanceof Date &&
            end instanceof Date &&
            end.getTime() <= start.getTime()
        ) {
            endControl.setErrors({ ...endControl.errors, dateRange: true });
        } else {
            const errors = { ...endControl.errors };
            delete errors['dateRange'];
            endControl.setErrors(Object.keys(errors).length ? errors : null);
        }
    }

    submit() {
        if (this.form.invalid) return;
        this.loading.set(true);

        const value = this.form.value;
        const payload = {
            name: value.name!,
            description: value.description ?? undefined,
            companyId: Number(value.companyId),
            perks: value.perks ?? [],
            maxBenefitAmount: value.maxBenefitAmount ? Number(value.maxBenefitAmount) : undefined,
            startDate: value.startDate ? this.formatDate(value.startDate as Date) : undefined,
            endDate: value.endDate ? this.formatDate(value.endDate as Date) : undefined,
            isActive: value.isActive ?? true,
        };

        const request$ = this.isEdit
            ? this.service.update(this.data!.id, payload)
            : this.service.create(payload);

        request$.subscribe({
            next: () => this.dialogRef.close(true),
            error: () => this.loading.set(false),
        });
    }

    private formatDate(date: Date): string {
        return format(date, 'yyyy-MM-dd'); // → 'YYYY-MM-DD'
    }
}