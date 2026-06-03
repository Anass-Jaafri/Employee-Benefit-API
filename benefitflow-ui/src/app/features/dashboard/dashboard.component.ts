import { Component, computed, inject } from '@angular/core';
import { DashboardLayoutComponent } from '../../layout/dashboard-layout/dashboard-layout.component';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DashboardLayoutComponent],
  template: `<app-dashboard-layout />`,
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly isHrManager = computed(() => this.currentUser()?.role === 'hr_manager');

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/auth/login']),
    });
  }
}
