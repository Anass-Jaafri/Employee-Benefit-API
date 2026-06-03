import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { DashboardHeaderComponent } from '../components/dashboard-header/dashboard-header.component';
import { DashboardSidebarComponent } from '../components/dashboard-sidebar/dashboard-sidebar.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, DashboardHeaderComponent, DashboardSidebarComponent],
  templateUrl: './dashboard-layout.component.html',
})
export class DashboardLayoutComponent {
  private readonly authService = inject(AuthService);
  readonly theme = inject(ThemeService);

  readonly currentUser = this.authService.currentUser;
  readonly currentRole = computed(
    () => (this.currentUser()?.role as 'admin' | 'hr_manager' | 'employee' | null) ?? null,
  );

  readonly sidebarOpen = signal(false);

  openSidebar(): void {
    this.sidebarOpen.set(true);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((value) => !value);
  }
}
