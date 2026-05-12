// features/dashboard/dashboard.component.ts
import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
    label: string;
    icon: string;
    route: string;
}

@Component({
    selector: 'app-dashboard',
    imports: [
        RouterOutlet,
        RouterLink,
        RouterLinkActive,
        MatSidenavModule,
        MatToolbarModule,
        MatListModule,
        MatIconModule,
        MatButtonModule,
        MatDividerModule,
    ],
    template: `
    <mat-sidenav-container class="sidenav-container">

      <mat-sidenav mode="side" opened class="sidenav">
        <div class="sidenav-header">
          <mat-icon class="logo-icon">verified</mat-icon>
          <span class="logo-text">BenefitFlow</span>
        </div>

        <mat-divider />

        <mat-nav-list>
  @for (item of navItems; track item.route) {
    <mat-list-item
      [routerLink]="item.route"
      routerLinkActive="active-link"
    >
      <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
      <span matListItemTitle>{{ item.label }}</span>
    </mat-list-item>
  }
</mat-nav-list>

        <div class="sidenav-footer">
          <mat-divider />
          <div class="user-info">
            <mat-icon>account_circle</mat-icon>
            <div class="user-details">
              <span class="user-email">{{ currentUser()?.email }}</span>
              <span class="user-role">{{ currentUser()?.role }}</span>
            </div>
          </div>
          <button mat-button class="logout-btn" (click)="logout()">
            <mat-icon>logout</mat-icon>
            Sign out
          </button>
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="main-content">
        <mat-toolbar color="primary">
          <span>{{ activePageTitle() }}</span>
        </mat-toolbar>
        <div class="page-container">
          <router-outlet />
        </div>
      </mat-sidenav-content>

    </mat-sidenav-container>
  `,
    styles: [`
    .sidenav-container {
      height: 100vh;
    }
    .sidenav {
      width: 260px;
      display: flex;
      flex-direction: column;
    }
    .sidenav-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px;
    }
    .logo-icon {
      color: #1976d2;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    .logo-text {
      font-size: 20px;
      font-weight: 600;
    }
    mat-nav-list {
      flex: 1;
      padding-top: 8px;
    }
    a.active-link {
      background: rgba(25, 118, 210, 0.12);
      color: #1976d2;
      border-radius: 4px;
    }
    a.active-link mat-icon {
      color: #1976d2;
    }
    .sidenav-footer {
      padding: 8px;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 8px;
    }
    .user-details {
      display: flex;
      flex-direction: column;
    }
    .user-email {
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 160px;
    }
    .user-role {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .logout-btn {
      width: 100%;
      justify-content: flex-start;
      color: #666;
    }
    .main-content {
      display: flex;
      flex-direction: column;
    }
    .page-container {
      padding: 24px;
      flex: 1;
      overflow-y: auto;
    }
  `],
})
export class DashboardComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    readonly currentUser = this.authService.currentUser;

    readonly navItems: NavItem[] = [
        { label: 'Companies', icon: 'business', route: '/dashboard/companies' },
        { label: 'Employees', icon: 'people', route: '/dashboard/employees' },
        { label: 'Benefit Packages', icon: 'card_giftcard', route: '/dashboard/benefit-packages' },
        { label: 'Claims', icon: 'receipt_long', route: '/dashboard/claims' },
    ];

    activePageTitle() {
        const match = this.navItems.find(item =>
            this.router.url.startsWith(item.route)
        );
        return match?.label ?? 'Dashboard';
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/auth/login']);
    }
}