import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AppRole, DASHBOARD_NAV } from '../../dashboard-nav.config';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, TitleCasePipe],
  templateUrl: './dashboard-sidebar.component.html',
})
export class DashboardSidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @Input() open = false;
  @Input() role: AppRole | null = null;
  @Output() closeSidebar = new EventEmitter<void>();

  readonly currentUser = this.authService.currentUser;

  readonly navItems = computed(() =>
    DASHBOARD_NAV.filter((item) => {
      if (!item.roles?.length) return true;
      return this.role ? item.roles.includes(this.role) : false;
    }),
  );

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.closeSidebar.emit();
        this.router.navigate(['/auth/login']);
      },
    });
  }

  onNavigate(): void {
    this.closeSidebar.emit();
  }
}
