import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionCardComponent } from '../../../shared/components/section-card/section-card.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [RouterLink, SectionCardComponent, StatCardComponent],
  template: `
    <section class="dashboard-grid">
      <app-stat-card
        label="Employees"
        value="Your Team"
        meta="Manage employee records"
        icon="badge"
      />
      <app-stat-card
        label="Claims"
        value="Review"
        meta="Handle submissions efficiently"
        icon="task_alt"
      />
      <app-stat-card
        label="Packages"
        value="Enroll"
        meta="Assign employees to plans"
        icon="volunteer_activism"
      />
      <app-stat-card
        label="Profile"
        value="Update"
        meta="Keep your account current"
        icon="account_circle"
      />
    </section>

    <div class="mt-6 grid gap-6 xl:grid-cols-[1.4fr_minmax(0,1fr)]">
      <app-section-card
        title="HR manager workspace"
        subtitle="Manage your assigned company employees, claims, and package enrollments."
      >
        <div class="grid gap-4 md:grid-cols-2">
          <div class="soft-panel">
            <h3
              class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            >
              Today’s focus
            </h3>
            <ul class="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
              <li>• Review pending employee claims.</li>
              <li>• Enroll eligible employees into active packages.</li>
              <li>• Keep employee profile data complete and current.</li>
              <li>• Coordinate plan coverage updates with admin.</li>
            </ul>
          </div>

          <div
            class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <h3
              class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            >
              Workflow status
            </h3>

            <div class="mt-4 space-y-4">
              <div>
                <div class="mb-1 flex items-center justify-between text-sm">
                  <span class="text-slate-600 dark:text-slate-300">Employee onboarding</span>
                  <span class="font-semibold text-slate-900 dark:text-white">81%</span>
                </div>
                <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div class="h-2 w-[81%] rounded-full bg-sky-600"></div>
                </div>
              </div>

              <div>
                <div class="mb-1 flex items-center justify-between text-sm">
                  <span class="text-slate-600 dark:text-slate-300">Claims review</span>
                  <span class="font-semibold text-slate-900 dark:text-white">68%</span>
                </div>
                <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div class="h-2 w-[68%] rounded-full bg-amber-500"></div>
                </div>
              </div>

              <div>
                <div class="mb-1 flex items-center justify-between text-sm">
                  <span class="text-slate-600 dark:text-slate-300">Enrollment completion</span>
                  <span class="font-semibold text-slate-900 dark:text-white">87%</span>
                </div>
                <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div class="h-2 w-[87%] rounded-full bg-emerald-600"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </app-section-card>

      <app-section-card title="Quick links" subtitle="Jump directly into your main workflows.">
        <div class="grid gap-3">
          <a routerLink="/dashboard/employees" class="quick-link">Manage employees</a>
          <a routerLink="/dashboard/benefit-packages" class="quick-link">Enroll in packages</a>
          <a routerLink="/dashboard/claims" class="quick-link">Review claims</a>
          <a routerLink="/dashboard/profile" class="quick-link">Update profile</a>
        </div>
      </app-section-card>
    </div>
  `,
})
export class HrDashboardComponent {}
