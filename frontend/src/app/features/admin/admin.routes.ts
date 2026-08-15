import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./shell/admin-shell').then((m) => m.AdminShell),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/admin-dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'users',
        loadComponent: () => import('./users/users-page/users-page').then((m) => m.UsersPage),
      },
      {
        path: 'signup-requests',
        loadComponent: () =>
          import('./signup-requests/signup-requests-page/signup-requests-page').then(
            (m) => m.SignupRequestsPage,
          ),
      },
      {
        path: 'password-reset-requests',
        loadComponent: () =>
          import('./password-reset-requests/password-reset-requests-page/password-reset-requests-page').then(
            (m) => m.PasswordResetRequestsPage,
          ),
      },
      {
        path: 'security-questions',
        loadComponent: () =>
          import('./security-questions/security-questions-setup/security-questions-setup').then(
            (m) => m.SecurityQuestionsSetup,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
];
