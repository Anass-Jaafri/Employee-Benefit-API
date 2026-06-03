import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { AdminDashboardComponent } from './components/admin-dashboard.component';
import { HrDashboardComponent } from './components/hr-dashboard.component';
import { EmployeeDashboardComponent } from './components/employee-dashboard.component';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    AdminDashboardComponent,
    HrDashboardComponent,
    EmployeeDashboardComponent,
  ],
  template: `
    <section class="page-header">
      <div>
        <h1 class="page-title">Dashboard Overview</h1>
        <p class="page-subtitle">
          Welcome back. Here is a quick summary of your benefits workspace.
        </p>
      </div>
    </section>

    @if (isAdmin()) {
      <app-admin-dashboard />
    } @else if (isHrManager()) {
      <app-hr-dashboard />
    } @else if (isEmployee()) {
      <app-employee-dashboard />
    } @else {
      <div class="content-card">
        <p class="text-sm text-slate-600">No dashboard is available for your current role.</p>
      </div>
    }
  `,
})
export class DashboardHomeComponent {
  private readonly authService = inject(AuthService);
  private readonly currentUser = this.authService.currentUser;

  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly isHrManager = computed(() => this.currentUser()?.role === 'hr_manager');
  readonly isEmployee = computed(() => this.currentUser()?.role === 'employee');
}
