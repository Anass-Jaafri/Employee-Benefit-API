import { Component, computed, inject } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatListModule, MatIconModule,
    MatButtonModule, MatToolbarModule, TitleCasePipe
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav mode="side" opened class="sidenav">

        <div class="sidenav-header">
          <span class="app-name">BenefitFlow</span>
          <span class="user-role">{{ currentUser()?.role | titlecase }}</span>
        </div>

        <mat-nav-list>
          <a mat-list-item routerLink="home" routerLinkActive="active-link">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>

          @if (isAdmin()) {
            <a mat-list-item routerLink="companies" routerLinkActive="active-link">
              <mat-icon matListItemIcon>business</mat-icon>
              <span matListItemTitle>Companies</span>
            </a>
          }

          @if (isAdmin() || isHrManager()) {
            <a mat-list-item routerLink="employees" routerLinkActive="active-link">
              <mat-icon matListItemIcon>people</mat-icon>
              <span matListItemTitle>Employees</span>
            </a>
            <a mat-list-item routerLink="benefit-packages" routerLinkActive="active-link">
              <mat-icon matListItemIcon>card_membership</mat-icon>
              <span matListItemTitle>Benefit Packages</span>
            </a>
          }

          <a mat-list-item routerLink="claims" routerLinkActive="active-link">
            <mat-icon matListItemIcon>receipt_long</mat-icon>
            <span matListItemTitle>Claims</span>
          </a>
        </mat-nav-list>
        <a mat-list-item routerLink="profile" routerLinkActive="active-link">
  <mat-icon matListItemIcon>manage_accounts</mat-icon>
  <span matListItemTitle>Profile</span>
</a>

        <div class="sidenav-footer">
          <button mat-button (click)="logout()">
            <mat-icon>logout</mat-icon> Sign out
          </button>
        </div>

      </mat-sidenav>

      <mat-sidenav-content class="main-content">
        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container { height: 100vh; }
    .sidenav { width: 240px; display: flex; flex-direction: column; }
    .sidenav-header { padding: 24px 16px 8px; }
    .app-name { display: block; font-size: 18px; font-weight: 700; color: #1976d2; }
    .user-role { display: block; font-size: 12px; color: rgba(0,0,0,0.5); margin-top: 2px; }
    .sidenav-footer { margin-top: auto; padding: 16px; }
    .active-link { background: rgba(25,118,210,0.08) !important; color: #1976d2 !important; }
    .active-link mat-icon { color: #1976d2; }
    .main-content { background: #f5f5f5; }
  `],
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