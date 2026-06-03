import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionCardComponent } from '../../../shared/components/section-card/section-card.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [RouterLink, SectionCardComponent, StatCardComponent],
  template: `
    <section class="dashboard-grid">
      <app-stat-card
        label="My Benefits"
        value="Available"
        meta="Review your active packages"
        icon="card_giftcard"
      />
      <app-stat-card label="Claims" value="Submit" meta="Request reimbursements" icon="receipt" />
      <app-stat-card
        label="Status"
        value="Track"
        meta="Follow approval progress"
        icon="query_stats"
      />
      <app-stat-card
        label="Profile"
        value="Maintain"
        meta="Keep your details updated"
        icon="person"
      />
    </section>

    <div class="mt-6 grid gap-6 xl:grid-cols-[1.4fr_minmax(0,1fr)]">
      <app-section-card
        title="Employee workspace"
        subtitle="Access your benefits, track claims, and keep your profile information up to date."
      >
        <div class="grid gap-4 md:grid-cols-2">
          <div class="soft-panel">
            <h3
              class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            >
              Suggested next steps
            </h3>
            <ul class="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
              <li>• Review the benefit packages available to you.</li>
              <li>• Submit claims for eligible expenses.</li>
              <li>• Track pending approvals and payment progress.</li>
              <li>• Confirm your personal information is correct.</li>
            </ul>
          </div>

          <div
            class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <h3
              class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            >
              Activity summary
            </h3>

            <div class="mt-4 space-y-4">
              <div>
                <div class="mb-1 flex items-center justify-between text-sm">
                  <span class="text-slate-600 dark:text-slate-300">Benefits review</span>
                  <span class="font-semibold text-slate-900 dark:text-white">73%</span>
                </div>
                <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div class="h-2 w-[73%] rounded-full bg-sky-600"></div>
                </div>
              </div>

              <div>
                <div class="mb-1 flex items-center justify-between text-sm">
                  <span class="text-slate-600 dark:text-slate-300">Claim completion</span>
                  <span class="font-semibold text-slate-900 dark:text-white">64%</span>
                </div>
                <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div class="h-2 w-[64%] rounded-full bg-amber-500"></div>
                </div>
              </div>

              <div>
                <div class="mb-1 flex items-center justify-between text-sm">
                  <span class="text-slate-600 dark:text-slate-300">Profile completeness</span>
                  <span class="font-semibold text-slate-900 dark:text-white">91%</span>
                </div>
                <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div class="h-2 w-[91%] rounded-full bg-emerald-600"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </app-section-card>

      <app-section-card title="Quick links" subtitle="Open the areas you use most often.">
        <div class="grid gap-3">
          <a routerLink="/dashboard/benefit-packages" class="quick-link"
            >View my benefit packages</a
          >
          <a routerLink="/dashboard/claims" class="quick-link">Submit or track claims</a>
          <a routerLink="/dashboard/profile" class="quick-link">Update my profile</a>
        </div>
      </app-section-card>
    </div>
  `,
})
export class EmployeeDashboardComponent {}
