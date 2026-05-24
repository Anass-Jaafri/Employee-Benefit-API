import { Component, inject, computed } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { AdminDashboardComponent } from './components/admin-dashboard.component';
import { HrDashboardComponent } from './components/hr-dashboard.component';
import { EmployeeDashboardComponent } from './components/employee-dashboard.component';

@Component({
  selector: 'app-dashboard-home',
  imports: [AdminDashboardComponent, HrDashboardComponent, EmployeeDashboardComponent],
  template: `
    @if (isAdmin())     { <app-admin-dashboard /> }
    @if (isHrManager()) { <app-hr-dashboard /> }
    @if (isEmployee())  { <app-employee-dashboard /> }
  `,
})
export class DashboardHomeComponent {
  private authService = inject(AuthService);
  private currentUser = this.authService.currentUser;

  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly isHrManager = computed(() => this.currentUser()?.role === 'hr_manager');
  readonly isEmployee = computed(() => this.currentUser()?.role === 'employee');
}