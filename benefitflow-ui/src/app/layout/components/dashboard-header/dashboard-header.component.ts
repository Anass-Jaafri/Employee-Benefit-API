import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, EventEmitter, Output, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { DashboardBreadcrumbComponent } from '../dashboard-breadcrumb/dashboard-breadcrumb.component';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, TitleCasePipe, DashboardBreadcrumbComponent],
  templateUrl: './dashboard-header.component.html',
})
export class DashboardHeaderComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly theme = inject(ThemeService);

  @Output() menuClick = new EventEmitter<void>();

  readonly currentUser = this.authService.currentUser;

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly pageTitle = computed(() => {
    const url = this.currentUrl();
    const segment = url.split('/').filter(Boolean).pop() ?? 'dashboard';

    switch (segment) {
      case 'home':
        return 'Dashboard';
      case 'benefit-packages':
        return 'Benefit Packages';
      default:
        return segment.replace(/-/g, ' ');
    }
  });

  readonly pageSubtitle = computed(() => {
    const role = this.currentUser()?.role;
    if (!role) return 'Welcome back';
    return `Signed in as ${role.replace('_', ' ')}`;
  });
}
