import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionCardComponent } from '../../../shared/components/section-card/section-card.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, SectionCardComponent, StatCardComponent],
  template: `
    <section class="dashboard-grid">
      <app-stat-card
        label="Organizations"
        value="Manage"
        meta="Create and maintain companies"
        icon="business"
      />
      <app-stat-card
        label="Employees"
        value="Track"
        meta="Oversee workforce records"
        icon="groups"
      />
      <app-stat-card
        label="Benefit Packages"
        value="Configure"
        meta="Define package availability"
        icon="featured_seasonal_and_gifts"
      />
      <app-stat-card
        label="Claims"
        value="Review"
        meta="Audit platform-wide activity"
        icon="receipt_long"
      />
    </section>

    <div class="mt-6 grid gap-6 xl:grid-cols-[1.4fr_minmax(0,1fr)]">
      <app-section-card
        title="Administrator workspace"
        subtitle="Use the navigation to manage the full benefits lifecycle across your organization."
      >
        <div class="grid gap-4 md:grid-cols-2">
          <div class="soft-panel">
            <h3
              class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            >
              Recommended actions
            </h3>
            <ul class="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
              <li>• Review newly created companies and assign ownership.</li>
              <li>• Verify employees are assigned to the correct organizations.</li>
              <li>• Audit package limits and active benefit offerings.</li>
              <li>• Monitor pending claims and resolve blockers quickly.</li>
            </ul>
          </div>

          <div
            class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <h3
              class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            >
              Platform health
            </h3>

            <div class="mt-4 space-y-4">
              <div>
                <div class="mb-1 flex items-center justify-between text-sm">
                  <span class="text-slate-600 dark:text-slate-300">Profile setup</span>
                  <span class="font-semibold text-slate-900 dark:text-white">92%</span>
                </div>
                <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div class="h-2 w-[92%] rounded-full bg-sky-600"></div>
                </div>
              </div>

              <div>
                <div class="mb-1 flex items-center justify-between text-sm">
                  <span class="text-slate-600 dark:text-slate-300">Access controls</span>
                  <span class="font-semibold text-slate-900 dark:text-white">88%</span>
                </div>
                <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div class="h-2 w-[88%] rounded-full bg-emerald-600"></div>
                </div>
              </div>

              <div>
                <div class="mb-1 flex items-center justify-between text-sm">
                  <span class="text-slate-600 dark:text-slate-300">Claims processing</span>
                  <span class="font-semibold text-slate-900 dark:text-white">76%</span>
                </div>
                <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div class="h-2 w-[76%] rounded-full bg-amber-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </app-section-card>

      <app-section-card
        title="Quick links"
        subtitle="Fast access to the most common administrator actions."
      >
        <div class="grid gap-3">
          <a routerLink="/dashboard/companies" class="quick-link">Manage companies</a>
          <a routerLink="/dashboard/employees" class="quick-link">Review employees</a>
          <a routerLink="/dashboard/benefit-packages" class="quick-link"
            >Configure benefit packages</a
          >
          <a routerLink="/dashboard/claims" class="quick-link">Review claims</a>
        </div>
      </app-section-card>
    </div>
  `,
})
export class AdminDashboardComponent {}
