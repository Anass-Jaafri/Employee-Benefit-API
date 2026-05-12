import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard/companies',
        pathMatch: 'full'
    },

    {
        path: 'auth',
        children: [
            {
                path: 'login',
                loadComponent: () =>
                    import('./features/auth/login/login.component').then(m => m.LoginComponent),
            },
            {
                path: 'register',
                loadComponent: () =>
                    import('./features/auth/register/register.component').then(m => m.RegisterComponent),
            },
        ],
    },
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        children: [
            {
                path: 'companies',
                loadComponent: () =>
                    import('./features/companies/companies.component').then(m => m.CompaniesComponent),
            },
            {
                path: 'employees',
                loadComponent: () =>
                    import('./features/employees/employees.component').then(m => m.EmployeesComponent),
            },
            {
                path: 'benefit-packages',
                loadComponent: () =>
                    import('./features/benefit-packages/benefit-packages.component').then(m => m.BenefitPackagesComponent),
            },
            {
                path: 'claims',
                loadComponent: () =>
                    import('./features/claims/claims.component').then(m => m.ClaimsComponent),
            },
        ],
    },
    {
        path: '**',
        redirectTo: 'auth/login'
    },
];
