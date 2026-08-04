import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/landing/landing').then((m) => m.Landing),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./shared/components/unauthorized/unauthorized').then((m) => m.Unauthorized),
  },
  {
    path: 'coordinator',
    canActivate: [authGuard, roleGuard],
    data: { role: 'coordinator' },
    loadChildren: () => import('./features/coordinator/coordinator.routes').then((m) => m.COORDINATOR_ROUTES),
  },
  {
    path: 'student',
    canActivate: [authGuard, roleGuard],
    data: { role: 'student' },
    loadChildren: () => import('./features/student/student.routes').then((m) => m.STUDENT_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
