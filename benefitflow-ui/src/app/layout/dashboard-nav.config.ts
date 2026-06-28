export type AppRole = 'admin' | 'hr_manager' | 'employee';

export interface DashboardNavItem {
  label: string;
  route: string;
  icon: string;
  roles?: AppRole[];
}

export const DASHBOARD_NAV: DashboardNavItem[] = [
  {
    label: 'Dashboard',
    route: '/dashboard/home',
    icon: 'dashboard',
  },
  {
    label: 'Companies',
    route: '/dashboard/companies',
    icon: 'business',
    roles: ['admin'],
  },
  {
    label: 'Employees',
    route: '/dashboard/employees',
    icon: 'groups',
    roles: ['admin', 'hr_manager'],
  },
  {
    label: 'Benefit Packages',
    route: '/dashboard/benefit-packages',
    icon: 'card_giftcard',
    roles: ['admin', 'hr_manager', 'employee'],
  },
  {
    label: 'Claims',
    route: '/dashboard/claims',
    icon: 'receipt_long',
  },
  {
    label: 'Profile',
    route: '/dashboard/profile',
    icon: 'manage_accounts',
  },
];
