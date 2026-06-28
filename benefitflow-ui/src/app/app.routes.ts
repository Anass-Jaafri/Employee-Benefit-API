import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { Component } from '@angular/core';

@Component({ standalone: true, template: '' })
class EmptyComponent {}

function lazyLoad(importFn: () => Promise<any>) {
  return importFn().catch(() => {
    window.location.reload();
    return { default: EmptyComponent };
  });
}

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard/home', pathMatch: 'full' },

  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          lazyLoad(() =>
            import('./features/auth/login/login.component').then((m) => m.LoginComponent),
          ),
      },
      {
        path: 'register',
        loadComponent: () =>
          lazyLoad(() =>
            import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
          ),
      },
    ],
  },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      lazyLoad(() =>
        import('./layout/dashboard-layout/dashboard-layout.component').then(
          (m) => m.DashboardLayoutComponent,
        ),
      ),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },

      // ── All authenticated roles ─────────────────────────────────────────
      {
        path: 'home',
        loadComponent: () =>
          lazyLoad(() =>
            import('./features/dashboard/dashboard-home.component').then(
              (m) => m.DashboardHomeComponent,
            ),
          ),
      },
      {
        path: 'claims',
        loadComponent: () =>
          lazyLoad(() =>
            import('./features/claims/claims.component').then((m) => m.ClaimsComponent),
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          lazyLoad(() =>
            import('./features/profile/profile.component').then((m) => m.ProfileComponent),
          ),
      },

      {
        path: 'benefit-packages',
        loadComponent: () =>
          lazyLoad(() =>
            import('./features/benefit-packages/benefit-packages.component').then(
              (m) => m.BenefitPackagesComponent,
            ),
          ),
      },

      // ── HR Manager + Admin ─────────────────────────────────────────────
      {
        path: 'employees',
        canActivate: [roleGuard(['admin', 'hr_manager'])],
        loadComponent: () =>
          lazyLoad(() =>
            import('./features/employees/employees.component').then((m) => m.EmployeesComponent),
          ),
      },

      // ── Admin only ────────────────────────────────────────────────────
      {
        path: 'companies',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          lazyLoad(() =>
            import('./features/companies/companies.component').then((m) => m.CompaniesComponent),
          ),
      },
    ],
  },

  { path: '**', redirectTo: 'auth/login' },
];
