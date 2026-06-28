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
  templateUrl: `./dashboard-home.component.html`,
})
export class DashboardHomeComponent {
  private readonly authService = inject(AuthService);
  private readonly currentUser = this.authService.currentUser;

  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly isHrManager = computed(() => this.currentUser()?.role === 'hr_manager');
  readonly isEmployee = computed(() => this.currentUser()?.role === 'employee');
}
